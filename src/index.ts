#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import express from "express";
import open from "open";
import storage from "node-persist";
import * as dotenv from "dotenv";
import { createServer } from "http";

// Load environment variables
dotenv.config();

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";
const REDIRECT_URI = "http://localhost:3000/callback";
const PORT = 3000;

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// GitHub authentication state
let authenticatedUser: string | null = null;
let octokit: Octokit | null = null;
let authServer: ReturnType<typeof createServer> | null = null;

// Initialize persistent storage
await storage.init({
  dir: ".node-persist/weather-mcp", // C:\Users\Name_SecondName\.node-persist\weather-mcp
});

// Exchange OAuth code for access token
async function exchangeCodeForToken(code: string): Promise<string | null> {
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    return null;
  }
}

// Start OAuth flow by opening browser
async function startOAuthFlow(): Promise<string | null> {
  return new Promise((resolve) => {
    const app = express();
    
    app.get("/callback", async (req, res) => {
      const code = req.query.code as string;
      
      if (!code) {
        res.send("❌ Authentication failed: No code received");
        resolve(null);
        return;
      }

      const token = await exchangeCodeForToken(code);
      
      if (token) {
        res.send("✅ Authentication successful! You can close this window and return to your application.");
        resolve(token);
      } else {
        res.send("❌ Authentication failed: Could not exchange code for token");
        resolve(null);
      }

      // Close server after handling callback
      setTimeout(() => {
        authServer?.close();
        authServer = null;
      }, 1000);
    });

    authServer = app.listen(PORT, () => {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=`;
      console.error(`Opening browser for GitHub authentication...`);
      console.error(`If browser doesn't open, visit: ${authUrl}`);
      open(authUrl);
    });
  });
}

// Verify GitHub token and authenticate user
async function authenticateWithGitHub(token: string): Promise<{ success: boolean; username?: string; error?: string }> {
  try {
    const testOctokit = new Octokit({ auth: token });
    const { data: user } = await testOctokit.users.getAuthenticated();
    
    // Store authenticated state
    octokit = testOctokit;
    authenticatedUser = user.login;
    
    // Persist token for future sessions
    await storage.setItem("github_token", token);
    await storage.setItem("github_user", user.login);
    
    return { success: true, username: user.login };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Authentication failed" };
  }
}

// Try to restore authentication from stored token
async function restoreAuthentication(): Promise<boolean> {
  const token = await storage.getItem("github_token");
  const username = await storage.getItem("github_user");
  
  if (!token || !username) {
    return false;
  }

  const result = await authenticateWithGitHub(token);
  if (result.success) {
    console.error(`Restored authentication for user: ${username}`);
    return true;
  }
  
  // Token is invalid, clear storage
  await storage.clear();
  return false;
}

// Ensure user is authenticated (restore or start OAuth)
async function ensureAuthenticated(): Promise<boolean> {
  if (isAuthenticated()) {
    return true;
  }

  // Try to restore from storage
  const restored = await restoreAuthentication();
  if (restored) {
    return true;
  }

  // Check if OAuth is configured
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error("GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.");
    return false;
  }

  // Start OAuth flow
  console.error("Authentication required. Starting OAuth flow...");
  const token = await startOAuthFlow();
  
  if (!token) {
    return false;
  }

  const result = await authenticateWithGitHub(token);
  return result.success;
}

// Check if user is authenticated
function isAuthenticated(): boolean {
  return authenticatedUser !== null && octokit !== null;
}

// Helper function for making NWS API requests
async function makeNWSRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}

// Format alert data
function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}

interface ForecastPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
}

interface AlertsResponse {
  features: AlertFeature[];
}

interface PointsResponse {
  properties: {
    forecast?: string;
  };
}

interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
}

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "2.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register authentication tool
server.tool(
  "authenticate",
  "Authenticate with GitHub using a personal access token",
  {
    token: z.string().describe("GitHub personal access token"),
  },
  async ({ token }) => {
    const result = await authenticateWithGitHub(token);
    
    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Successfully authenticated as ${result.username}. You can now use weather tools.`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Authentication failed: ${result.error}. Please provide a valid GitHub personal access token.`,
          },
        ],
      };
    }
  },
);

// Register weather tools
server.tool(
  "get_alerts",
  "Get weather alerts for a state",
  {
    state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
  },
  async ({ state }) => {
    // Ensure authentication
    const authenticated = await ensureAuthenticated();
    if (!authenticated) {
      return {
        content: [
          {
            type: "text",
            text: "Authentication failed. Please ensure GitHub OAuth is configured correctly.",
          },
        ],
      };
    }

    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

    if (!alertsData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve alerts data",
          },
        ],
      };
    }

    const features = alertsData.features || [];
    if (features.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No active alerts for ${stateCode}`,
          },
        ],
      };
    }

    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: alertsText,
        },
      ],
    };
  },
);

server.tool(
  "get_forecast",
  "Get weather forecast for a location",
  {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    // Ensure authentication
    const authenticated = await ensureAuthenticated();
    if (!authenticated) {
      return {
        content: [
          {
            type: "text",
            text: "Authentication failed. Please ensure GitHub OAuth is configured correctly.",
          },
        ],
      };
    }

    // Get grid point data
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

    if (!pointsData) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
          },
        ],
      };
    }

    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to get forecast URL from grid point data",
          },
        ],
      };
    }

    // Get forecast data
    const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve forecast data",
          },
        ],
      };
    }

    const periods = forecastData.properties?.periods || [];
    if (periods.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No forecast periods available",
          },
        ],
      };
    }

    // Format forecast periods
    const formattedForecast = periods.map((period: ForecastPeriod) =>
      [
        `${period.name || "Unknown"}:`,
        `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
        `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        `${period.shortForecast || "No forecast available"}`,
        "---",
      ].join("\n"),
    );

    const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  },
);

async function main() {
  // Try to restore authentication on startup
  await restoreAuthentication();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
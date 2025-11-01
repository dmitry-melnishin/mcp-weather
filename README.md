# Weather MCP Server

A Model Context Protocol (MCP) server that provides weather forecasts and alerts using the Weather Service API. **Features automatic GitHub OAuth authentication via browser**.

## Features

- **Automatic Browser Authentication**: Seamlessly authenticate via GitHub OAuth in your browser
- **Persistent Sessions**: Stay authenticated across server restarts
- **Weather Forecasts**: Get detailed weather forecasts for any location by coordinates
- **Weather Alerts**: Retrieve active weather alerts by state code

## Installation

### NPM Installation
```bash
npm install -g @dmitry-melnishin/mcp-weather
```

### Usage in VS Code

Add this to your MCP settings file (`.vscode/mcp.json` or global settings):

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "@dmitry-melnishin/mcp-weather"],
      "env": {
        "GITHUB_CLIENT_ID": "your_github_oauth_client_id",
        "GITHUB_CLIENT_SECRET": "your_github_oauth_client_secret"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "weather": {
      "command": "mcp-weather",
      "env": {
        "GITHUB_CLIENT_ID": "your_github_oauth_client_id",
        "GITHUB_CLIENT_SECRET": "your_github_oauth_client_secret"
      }
    }
  }
}
```

Or if installed locally:

```json
{
  "weather": {
    "command": "node",
    "args": [
      "c:\\...\\build\\index.js"
    ],
    "env": {
      "GITHUB_CLIENT_ID": "your_github_oauth_client_id",
      "GITHUB_CLIENT_SECRET": "your_github_oauth_client_secret"
    }
  }
}
```

## Authentication Setup

### 1. Create a GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: Weather MCP Server (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy the **Client Secret**

### 2. Configure the MCP Server

Add the Client ID and Client Secret to your MCP configuration (see above) or create a `.env` file in the installation directory:

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

### 3. First Use

When you first use any weather tool:
1. Your browser will automatically open to GitHub's authorization page
2. Click **"Authorize"** to grant access
3. The browser will show a success message
4. Return to your application - you're now authenticated!

**Your authentication persists** across server restarts, so you only need to authenticate once.

## Available Tools

### get_forecast
Get weather forecast for a location. **Automatically handles authentication.**

**Parameters:**
- `latitude` (number): Latitude of the location (-90 to 90)
- `longitude` (number): Longitude of the location (-180 to 180)

**Example:**
```
Get forecast for latitude 40.7128, longitude -74.0060
```

### get_alerts
Get weather alerts. **Automatically handles authentication.**

**Parameters:**
- `state` (string): Two-letter state code (e.g., "CA", "NY")

**Example:**
```
Get weather alerts for CA
```

## Security Notes

- Your GitHub token is stored securely in local persistent storage
- Authentication persists across server restarts
- The OAuth flow uses standard GitHub OAuth with local callback
- No GitHub permissions/scopes are required
- The token is only used to verify your identity with GitHub

## Troubleshooting

**Browser doesn't open automatically?**
- Check the terminal output for the authorization URL and open it manually

**Authentication fails?**
- Verify your GitHub OAuth app Client ID and Client Secret are correct
- Ensure the callback URL is set to `http://localhost:3000/callback`
- Check that port 3000 is not already in use

**Token expired?**
- Simply use any weather tool again - you'll be prompted to re-authenticate

## Development

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup
```bash
git clone https://github.com/your-username/mcp-weather
cd mcp-weather
npm install
```

### Build
```bash
npm run build
```

### Local Testing
You can test the server locally by running:
```bash
node build/index.js
```

## API Source

This server uses the [National Weather Service API](https://www.weather.gov/documentation/services-web-api), which provides weather data for US locations only.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

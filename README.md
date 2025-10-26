# Weather MCP Server

A Model Context Protocol (MCP) server that provides weather forecasts and alerts using the US National Weather Service API. **Requires GitHub authentication** to access weather tools.

## Features

- **GitHub Authentication**: Secure access using GitHub personal access tokens
- **Weather Forecasts**: Get detailed weather forecasts for any US location by coordinates
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
      "args": ["-y", "@dmitry-melnishin/mcp-weather"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "weather": {
      "command": "mcp-weather"
    }
  }
}
```

## Authentication Setup

Before using the weather tools, you must authenticate with GitHub:

1. **Create a GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - You don't need to select any scopes - just name it (e.g., "MCP Weather")
   - Click "Generate token" and copy the token

2. **Authenticate in MCP**:
   - Use the `authenticate` tool with your GitHub token
   - Once authenticated, you can use all weather tools

**Example authentication:**
```
Tool: authenticate
Parameters: { "token": "ghp_your_github_token_here" }
```

## Available Tools

### authenticate
Authenticate with GitHub using a personal access token.

**Parameters:**
- `token` (string): GitHub personal access token

**Returns:** Success message with authenticated username or error message.

**Note:** You must authenticate before using any weather tools.

### get_forecast
Get weather forecast for a location. **Requires authentication.**

**Parameters:**
- `latitude` (number): Latitude of the location (-90 to 90)
- `longitude` (number): Longitude of the location (-180 to 180)

**Example:**
```
Get forecast for latitude 40.7128, longitude -74.0060
```

### get_alerts
Get weather alerts for a US state. **Requires authentication.**

**Parameters:**
- `state` (string): Two-letter state code (e.g., "CA", "NY")

**Example:**
```
Get weather alerts for CA
```

## Security Notes

- Your GitHub token is only stored in memory during the server session
- The token is never logged or persisted to disk
- No specific GitHub permissions/scopes are required
- The token is only used to verify your identity with GitHub

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

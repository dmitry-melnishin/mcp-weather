# Weather MCP Server

A Model Context Protocol (MCP) server that provides weather forecasts and alerts using the US National Weather Service API.

## Features

- **Weather Forecasts**: Get detailed weather forecasts for any US location by coordinates
- **Weather Alerts**: Retrieve active weather alerts by state code

## Installation

### NPM Installation
```bash
npm install -g @your-username/mcp-weather
```

### Usage in VS Code

Add this to your MCP settings file (`.vscode/mcp.json` or global settings):

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "@your-username/mcp-weather"]
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

## Available Tools

### get_forecast
Get weather forecast for a location.

**Parameters:**
- `latitude` (number): Latitude of the location (-90 to 90)
- `longitude` (number): Longitude of the location (-180 to 180)

**Example:**
```
Get forecast for latitude 40.7128, longitude -74.0060
```

### get_alerts
Get weather alerts for a US state.

**Parameters:**
- `state` (string): Two-letter state code (e.g., "CA", "NY")

**Example:**
```
Get weather alerts for CA
```

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

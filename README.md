# Related Identity MCP Server

A Model Context Protocol (MCP) server that helps discover related blockchain addresses and domain names for web3 identities across different platforms.

## Features

- 🔍 **Cross-Platform Identity Resolution**: Find related addresses across Ethereum, Farcaster, Lens, and other web3 platforms
- 🤖 **AI-Powered Analysis**: Uses OpenAI to intelligently extract and format related identity information
- 📡 **Web3.bio Integration**: Leverages the web3.bio API for comprehensive identity graph data
- ⚡ **MCP Compatible**: Works seamlessly with any MCP-compatible client


## Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd relate-account-mcp
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file
   echo "DATA_API_URL=data_api_server" > .env
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Configuration

Add the following configuration to your MCP client settings:

### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
//to your local relate-account-service
{
  "mcpServers": {
    "relate-account": {
      "command": "node",
      "args": ["/absolute/path/to/relate-account-mcp/build/index.js"]
    }
  }
}

//use publish service
{
  "mcpServers": {
    "relate-account": {
      "command": "npx",
      "args": [
        "-y",
        "@fengshanshan/mcp-server-relate-account"
      ],
      "env": {
        "DATA_API_URL": "web3.bio one"
        }
    }
  }
}
```

### Other MCP Clients
Use the built binary directly:
```bash
node /path/to/relate-account-mcp/build/index.js
```

## Usage

Once configured, you can use the `get-related-address` tool in your MCP client:

### Parameters
- **platform** (string): The platform to search on (e.g., "ethereum", "farcaster", "lens", "ens")
- **identity** (string): The user's identity (address, ENS domain, username, etc.)


## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# The compiled JavaScript will be in the build/ directory
```

---

**Note**: This MCP server requires an active internet connection to query the web3.bio API and OpenAI services.

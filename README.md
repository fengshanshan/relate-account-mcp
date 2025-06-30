# Related Identity MCP Server

[![smithery badge](https://smithery.ai/badge/@fengshanshan/relate-account-mcp)](https://smithery.ai/server/@fengshanshan/relate-account-mcp)

A Model Context Protocol (MCP) server that helps discover related blockchain addresses and domain names for web3 identities across different platforms.

## Tools

- 🔍 **get-related-address**
Find related addresses across Ethereum, Farcaster, Lens, and other web3 platforms. Leverages the data source in [relation-server](https://github.com/NextDotID/relation_server) of next.id.

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
    },
    "env": {
        "DATA_API_URL": "https://graph.web3.bio/graphql",
        "ACCESS_TOKEN":"YOUR_ACCESS_TOKEN" //if no access_token, will be limited after a certain amount of request
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
        "DATA_API_URL": "https://graph.web3.bio/graphql",
        "ACCESS_TOKEN":"YOUR_ACCESS_TOKEN" //if no access_token, will be limited after a certain amount of request
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

### Installing via Smithery

To install relate-account-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@fengshanshan/relate-account-mcp):

```bash
npx -y @smithery/cli install @fengshanshan/relate-account-mcp --client claude
```

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getTextResponseFromOpenAI } from "./utils.js";

import { z } from "zod";
import "dotenv/config";

const server = new McpServer({
  name: "relate-account",
  version: "1.0.0",
});

server.tool(
  "get-related-address",
  {
    platform: z
      .string()
      .describe(
        "The platform of a specific identity, e.g.: Ethereume, farcaster, lens"
      ),
    identity: z.string().describe("User's identity"),
  },
  async ({ platform, identity }) => {
    try {
      const response = await fetch(
        `https://api.web3.bio/graph?identity=${identity}&platform=${platform}`,
        {}
      );
      const json = await response.json();
      const input = `help me get the related address or domain name from the following text: ${json}`;
      const responseFromOpenAI = await getTextResponseFromOpenAI(input);

      return {
        content: [
          {
            type: "text",
            text: `${responseFromOpenAI}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching data ...`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

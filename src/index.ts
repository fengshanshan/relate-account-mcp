#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  getTextResponseFromGemini,
  getTextResponseFromOpenAI,
} from "./utils.js";

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
    let json = null;
    try {
      const request_url =
        process.env.DATA_API_URL + `?identity=${identity}&platform=${platform}`;
      const responseFromAPI = await fetch(request_url, {});
      json = await responseFromAPI.json();
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching data: ${(err as Error).message}`,
          },
        ],
      };
    }

    try {
      const input = `help me get the related address or domain name from the following text: ${json}`;
      let response = "";
      if (process.env.MODEL == "gemini") {
        response = await getTextResponseFromGemini(input);
      } else {
        response = await getTextResponseFromOpenAI(input);
      }

      return {
        content: [
          {
            type: "text",
            text: `${response}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `agent process data error: ${(err as Error).message}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Relate Account MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

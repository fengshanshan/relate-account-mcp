#!/usr/bin/env node
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import "dotenv/config";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Constants
const API_ENDPOINT =
  process.env.DATA_API_URL || "https://graph.web3.bio/graphql";
const REQUEST_TIMEOUT = 10000;
const CACHE_TTL = 5 * 60 * 1000;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Simple cache
const cache = new Map();

// Validation schemas
const PlatformSchema = z
  .enum([
    "ethereum",
    "solana",
    "ens",
    "sns",
    "farcaster",
    "lens",
    "clusters",
    "basenames",
    "unstoppabledomains",
    "space_id",
    "dotbit",
    "ckb",
    "box",
    "linea",
    "justaname",
    "zeta",
    "mode",
    "arbitrum",
    "taiko",
    "mint",
    "zkfair",
    "manta",
    "lightlink",
    "genome",
    "merlin",
    "alienx",
    "tomo",
    "ailayer",
    "gravity",
    "bitcoin",
    "litecoin",
    "dogecoin",
    "aptos",
    "stacks",
    "tron",
    "ton",
    "xrpc",
    "cosmos",
    "arweave",
    "algorand",
    "firefly",
    "particle",
    "privy",
    "twitter",
    "bluesky",
    "github",
    "discord",
    "telegram",
    "dentity",
    "email",
    "linkedin",
    "reddit",
    "nextid",
    "keybase",
    "facebook",
    "dns",
    "nftd",
    "gallery",
    "paragraph",
    "mirror",
    "instagram",
    "crowdsourcing",
    "nostr",
    "gmgn",
    "talentprotocol",
    "foundation",
    "rarible",
    "soundxyz",
    "warpcast",
    "opensea",
    "icebreaker",
    "tally",
  ])
  .or(z.string());

const IdentitySchema = z.string().min(1).max(256);

// GraphQL query template - keeping your current comprehensive query
const IDENTITY_QUERY = `
  query QUERY_PROFILE($platform: Platform!, $identity: String!) {
    identity(platform: $platform, identity: $identity) {
      id
      status
      aliases
      identity
      platform
      network
      isPrimary
      primaryName
      resolvedAddress {
        address
        network
      }
      ownerAddress {
        address
        network
      }
      managerAddress {
        address
        network
      }
      updatedAt
      profile {
        identity
        platform
        network
        address
        displayName
        avatar
        description
        addresses {
          address
          network
        }
      }
      identityGraph {
        graphId
        vertices {
          identity
          platform
          network
          isPrimary
          primaryName
          registeredAt
          managerAddress {
            address
            network
          }
          ownerAddress {
            address
            network
          }
          resolvedAddress {
            address
            network
          }
          updatedAt
          expiredAt
          profile {
            uid
            identity
            platform
            network
            address
            displayName
            avatar
            description
            texts
            addresses {
              address
              network
            }
          }
        }
      }
    }
  }
`;

// Utility functions
function createCacheKey(platform: string, identity: string): string {
  return `${platform}:${identity}`.toLowerCase();
}

async function executeGraphQLQuery(query: any): Promise<any> {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "relate-account-mcp/3.0.0",
      ...(process.env.ACCESS_TOKEN && {
        Authorization: process.env.ACCESS_TOKEN,
      }),
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(
      `GraphQL errors: ${json.errors.map((e: any) => e.message).join(", ")}`
    );
  }

  return json.data;
}

// Create server
const server = new Server(
  {
    name: "relate-account-streamable",
    version: "3.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set up tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get-related-address",
        description:
          "Retrieves all related identities associated with a specific platform identity. This tool helps discover cross-platform connections for the same person or entity. Use cases include: 1) Finding all accounts (Lens, Farcaster, ENS, etc.) belonging to the same person, 2) Resolving domain names to their underlying addresses (ENS domains, Lens handles, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              description:
                "The platform of a specific identity, e.g.: Ethereum, Farcaster, lens, ens",
            },
            identity: { type: "string", description: "User's identity" },
          },
          required: ["platform", "identity"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get-related-address") {
    try {
      const platform = PlatformSchema.parse(args?.platform);
      const identity = IdentitySchema.parse(args?.identity);

      // Input validation and sanitization
      const normalizedPlatform = platform.toLowerCase().trim();
      const normalizedIdentity = identity.trim();

      if (!normalizedIdentity) {
        throw new Error("Identity cannot be empty");
      }

      // Check cache first
      const cacheKey = createCacheKey(normalizedPlatform, normalizedIdentity);
      const cachedResult = cache.get(cacheKey);

      if (cachedResult) {
        console.error(`Cache hit for ${cacheKey}`);
        return {
          content: [
            {
              type: "text",
              text: `The related information is: ${JSON.stringify(
                cachedResult
              )}`,
            },
          ],
        };
      }

      console.error(
        `Fetching data for ${normalizedPlatform}:${normalizedIdentity}`
      );

      // Execute GraphQL query
      const data = await executeGraphQLQuery({
        query: IDENTITY_QUERY,
        variables: {
          platform: normalizedPlatform,
          identity: normalizedIdentity,
        },
      });

      // Cache the result
      cache.set(cacheKey, data);

      return {
        content: [
          {
            type: "text",
            text: `The related information is: ${JSON.stringify(data)}`,
          },
        ],
      };
    } catch (error) {
      const err = error as Error;
      console.error(`Error in get-related-address: ${err.message}`);

      return {
        content: [
          {
            type: "text",
            text: `Error fetching data: ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Express app
const app = express();
app.use(express.json());

// MCP endpoint
app.post("/mcp", async (req, res) => {
  try {
    // Use the server's internal request method
    const response = await (server as any).request(req.body);
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal error",
      },
    });
  }
});

app.get("/mcp", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(
    `data: ${JSON.stringify({
      jsonrpc: "2.0",
      method: "ping",
      params: { timestamp: Date.now() },
    })}\n\n`
  );
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    transport: "streamable-http",
    tools: ["get-related-address"],
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.error(
    `Relate Account MCP Server running on http://127.0.0.1:${PORT}/mcp`
  );
  console.error(`Health check available at: http://127.0.0.1:${PORT}/health`);
});

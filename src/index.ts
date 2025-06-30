#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { z } from "zod";
import "dotenv/config";

// Constants
const API_ENDPOINT =
  process.env.DATA_API_URL || "https://graph.web3.bio/graphql";
const REQUEST_TIMEOUT = 10000; // 10 seconds

interface GraphQLQuery {
  query: string;
  variables: Record<string, any>;
}

// GraphQL query template
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

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function executeGraphQLQuery(query: GraphQLQuery): Promise<any> {
  const response = await fetchWithTimeout(
    API_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "relate-account-mcp/3.0.0",
        ...(process.env.ACCESS_TOKEN && {
          Authorization: process.env.ACCESS_TOKEN,
        }),
      },
      body: JSON.stringify(query),
    },
    REQUEST_TIMEOUT
  );

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

const server = new McpServer({
  name: "relate-account",
  version: "3.0.0",
});

server.tool(
  "get-related-address",
  "Retrieves all related identities associated with a specific platform identity. This tool helps discover cross-platform connections for the same person or entity. Use cases include: 1) Finding all accounts (Lens, Farcaster, ENS, etc.) belonging to the same person, 2) Resolving domain names to their underlying addresses (ENS domains, Lens handles, etc.)",
  {
    platform: PlatformSchema.describe(
      "The platform of a specific identity, e.g.: Ethereum, Farcaster, lens, ens"
    ),
    identity: IdentitySchema.describe("User's identity"),
  },
  async ({ platform, identity }) => {
    try {
      // Input validation and sanitization
      const normalizedPlatform = platform.toLowerCase().trim();
      const normalizedIdentity = identity.trim();

      if (!normalizedIdentity) {
        throw new Error("Identity cannot be empty");
      }

      // Execute GraphQL query
      const data = await executeGraphQLQuery({
        query: IDENTITY_QUERY,
        variables: {
          platform: normalizedPlatform,
          identity: normalizedIdentity,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `The related information is: ${JSON.stringify(data)}`,
          },
        ],
      };
    } catch (err) {
      const error = err as Error;
      console.error(`Error in get-related-address: ${error.message}`);

      return {
        content: [
          {
            type: "text",
            text: `Error fetching data: ${error.message}`,
          },
        ],
        isError: true,
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

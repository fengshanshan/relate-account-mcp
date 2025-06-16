import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";

// Configuration
const ENDPOINT_URL =
  process.env.DATA_API_URL || "https://graph.web3.bio/graphql";
const OUTPUT_FILE = "./graphql.graphql";

/**
 * Exports GraphQL schema from web3.bio endpoint
 * This script fetches the GraphQL schema introspection and saves it as SDL
 */
async function exportGraphQLSchema() {
  try {
    const res = await axios.post(
      ENDPOINT_URL,
      {
        query: getIntrospectionQuery(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.data || !res.data.data) {
      throw new Error("Invalid response from GraphQL endpoint");
    }

    const schema = buildClientSchema(res.data.data);
    const sdl = printSchema(schema);

    // Ensure output directory exists
    const outputPath = path.resolve(OUTPUT_FILE);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`💾 Writing schema to: ${outputPath}`);
    fs.writeFileSync(outputPath, sdl, "utf8");

    console.log("✅ GraphQL schema exported successfully!");
    console.log(`📊 Schema size: ${(sdl.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("❌ Failed to export GraphQL schema:");

    if (axios.isAxiosError(error)) {
      console.error(`Network error: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(
          `Response: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }

    process.exit(1);
  }
}

// Run the script if called directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  exportGraphQLSchema();
}

export { exportGraphQLSchema };

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BrandContext } from '../core/brand-context.js';
import { ExtractionLoader } from '../core/extraction-loader.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/brand-resources.js';

async function main() {
  const server = new McpServer({
    name: 'h-graphic-generator',
    version: '0.1.0',
  });

  // Load brand config once at startup (shared across all handlers)
  const brandContext = await BrandContext.load();

  // Load Figma extractions (optional - gracefully handle if not present)
  let extractionLoader: ExtractionLoader | undefined;
  try {
    extractionLoader = await ExtractionLoader.load();
  } catch {
    console.error('Warning: Could not load extractions from brand/extracted/');
  }

  // Register all tools and resources
  registerTools(server, brandContext, extractionLoader);
  registerResources(server, brandContext);

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server error:', error);
  process.exit(1);
});

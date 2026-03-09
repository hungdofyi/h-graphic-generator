import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BrandContext } from '../core/brand-context.js';
import { ExtractionLoader } from '../core/extraction-loader.js';
import { ComponentLoader } from '../core/component-loader.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/brand-resources.js';

// Get project root from module location (dist/mcp/server.js -> project root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

async function main() {
  const server = new McpServer({
    name: 'h-graphic-generator',
    version: '0.1.0',
  });

  // Load brand config once at startup (shared across all handlers)
  const brandConfigPath = path.join(PROJECT_ROOT, 'brand/brand.json');
  const brandContext = await BrandContext.load(brandConfigPath);

  // Load Figma extractions (optional - gracefully handle if not present)
  let extractionLoader: ExtractionLoader | undefined;
  try {
    const extractedDir = path.join(PROJECT_ROOT, 'brand/extracted');
    extractionLoader = await ExtractionLoader.load(extractedDir);
  } catch {
    console.error('Warning: Could not load extractions from brand/extracted/');
  }

  // Load composable component system (Option B architecture)
  let componentLoader: ComponentLoader | undefined;
  try {
    const brandDir = path.join(PROJECT_ROOT, 'brand');
    componentLoader = await ComponentLoader.load(brandDir);
  } catch {
    console.error('Warning: Could not load components from brand/components/');
  }

  // Register all tools and resources
  registerTools(server, brandContext, extractionLoader, componentLoader);
  registerResources(server, brandContext);

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server error:', error);
  process.exit(1);
});

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BrandContext } from '../../core/brand-context.js';
import type { ExtractionLoader } from '../../core/extraction-loader.js';
import { registerRenderGraphicTool } from './render-graphic.js';
import { registerGenerateFromTemplateTool } from './generate-from-template.js';
import { registerListTemplatesTool } from './list-templates.js';
import { registerGetStyleProfileTool } from './get-style-profile.js';
import { registerValidateBrandTool } from './validate-brand.js';
import { registerListPatternsTool } from './list-patterns.js';
import { registerGetPatternTool } from './get-pattern.js';
import { registerListIconsTool } from './list-icons.js';

export function registerTools(
  server: McpServer,
  brandContext: BrandContext,
  extractionLoader?: ExtractionLoader
): void {
  // PRIMARY tool - Claude generates HTML/CSS, we render to image
  registerRenderGraphicTool(server, brandContext, extractionLoader);

  // Style profile - official brand guidelines from brand.json
  registerGetStyleProfileTool(server, brandContext);

  // Icon library
  registerListIconsTool(server);

  // Template shortcuts
  registerGenerateFromTemplateTool(server, brandContext);
  registerListTemplatesTool(server);

  // Validation
  registerValidateBrandTool(server, brandContext);

  // Pattern discovery (requires extraction loader)
  if (extractionLoader) {
    registerListPatternsTool(server, extractionLoader);
    registerGetPatternTool(server, extractionLoader);
  }
}

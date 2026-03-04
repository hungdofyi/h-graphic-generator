import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BrandContext } from '../../core/brand-context.js';
import { registerRenderGraphicTool } from './render-graphic.js';
import { registerGenerateFromTemplateTool } from './generate-from-template.js';
import { registerListTemplatesTool } from './list-templates.js';
import { registerGetStyleProfileTool } from './get-style-profile.js';
import { registerValidateBrandTool } from './validate-brand.js';

export function registerTools(server: McpServer, brandContext: BrandContext): void {
  // PRIMARY tool - Claude generates HTML/CSS, we render to image
  registerRenderGraphicTool(server, brandContext);

  // Style profile - teaches Claude HOW to apply brand tokens
  registerGetStyleProfileTool(server, brandContext);

  // Template shortcuts
  registerGenerateFromTemplateTool(server, brandContext);
  registerListTemplatesTool(server);

  // Validation
  registerValidateBrandTool(server, brandContext);
}

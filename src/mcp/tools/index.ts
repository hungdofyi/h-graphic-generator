import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BrandContext } from '../../core/brand-context.js';
import type { ExtractionLoader } from '../../core/extraction-loader.js';
import type { ComponentLoader } from '../../core/component-loader.js';
import { registerRenderGraphicTool } from './render-graphic.js';
import { registerCreateGraphicTool } from './create-graphic.js';
import { registerGenerateFromTemplateTool } from './generate-from-template.js';
import { registerListTemplatesTool } from './list-templates.js';
import { registerGetStyleProfileTool } from './get-style-profile.js';
import { registerValidateBrandTool } from './validate-brand.js';
import { registerListPatternsTool } from './list-patterns.js';
import { registerGetPatternTool } from './get-pattern.js';
import { registerListIconsTool } from './list-icons.js';
import { registerServePreviewTool, registerStopPreviewTool } from './serve-preview.js';

export function registerTools(
  server: McpServer,
  brandContext: BrandContext,
  extractionLoader?: ExtractionLoader,
  componentLoader?: ComponentLoader
): void {
  // PRIMARY tool - Claude generates HTML/CSS, we render to image
  registerRenderGraphicTool(server, brandContext, extractionLoader);

  // Guided workflow tool - uses elicitation for step-by-step input
  registerCreateGraphicTool(server);

  // Style profile - official brand guidelines from brand.json
  registerGetStyleProfileTool(server, brandContext);

  // Icon library
  registerListIconsTool(server);

  // Template shortcuts
  registerGenerateFromTemplateTool(server, brandContext);
  registerListTemplatesTool(server);

  // Validation
  registerValidateBrandTool(server, brandContext);

  // Preview server for Figma export
  registerServePreviewTool(server);
  registerStopPreviewTool(server);

  // Pattern discovery (extraction loader and/or component loader)
  if (extractionLoader || componentLoader) {
    registerListPatternsTool(server, extractionLoader, componentLoader);
    registerGetPatternTool(server, extractionLoader, componentLoader);
  }
}

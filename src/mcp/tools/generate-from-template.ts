import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BrandContext } from '../../core/brand-context.js';
import { Engine } from '../../core/engine.js';
import { ExportPipeline } from '../../core/export-pipeline.js';
import { validateOutputPath } from '../../core/sanitize.js';
import type { OutputFormat } from '../../core/types.js';
import { registry } from '../../templates/registry.js';

const GenerateFromTemplateSchema = z.object({
  template: z.string().describe('Template name (e.g., feature-illustration, process-steps)'),
  props: z.record(z.unknown()).describe('Template properties as JSON object'),
  output_path: z.string().describe('Output file path'),
  width: z.number().optional().describe('Override width (uses template default if omitted)'),
  height: z.number().optional().describe('Override height (uses template default if omitted)'),
  format: z
    .enum(['png', 'svg', 'jpg', 'webp'])
    .default('png')
    .describe('Output format'),
});

/**
 * Register the generate_from_template tool
 * Quick shortcut for using pre-built templates
 */
export function registerGenerateFromTemplateTool(
  server: McpServer,
  brandContext: BrandContext
): void {
  server.tool(
    'generate_from_template',
    'Generate graphic from a pre-built template. Faster than render_graphic for common layouts.',
    GenerateFromTemplateSchema.shape,
    async (args) => {
      const input = GenerateFromTemplateSchema.parse(args);

      try {
        // Validate output path (prevents directory traversal)
        const validatedPath = validateOutputPath(input.output_path);

        // Get template
        const template = registry.get(input.template);
        if (!template) {
          const available = registry.list().map((t) => t.name);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: `Template "${input.template}" not found`,
                  available_templates: available,
                }),
              },
            ],
            isError: true,
          };
        }

        // Determine size
        const width = input.width || template.defaultSize.width;
        const height = input.height || template.defaultSize.height;

        // Render template to HTML
        const html = template.render(input.props, brandContext.getConfig());

        // Initialize engine
        const engine = new Engine(brandContext);
        await engine.initialize();

        // Render HTML to SVG
        const svg = await engine.renderHtml(html, { width, height });

        // Export to final format
        const pipeline = new ExportPipeline();
        const outputBuffer = await pipeline.export(svg, input.format as OutputFormat, {
          width,
          height,
        });

        // Ensure output directory exists
        const outputDir = path.dirname(validatedPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Write output
        await fs.writeFile(validatedPath, outputBuffer);

        await engine.cleanup();

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                template: input.template,
                output: path.resolve(input.output_path),
                format: input.format,
                width,
                height,
                bytes: outputBuffer.length,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: (error as Error).message,
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}

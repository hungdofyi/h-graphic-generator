import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BrandContext } from '../../core/brand-context.js';
import { Engine } from '../../core/engine.js';
import { ExportPipeline } from '../../core/export-pipeline.js';
import { validateOutputPath } from '../../core/sanitize.js';
import type { OutputFormat } from '../../core/types.js';

const RenderGraphicSchema = z.object({
  html: z.string().describe('HTML/CSS code to render. Should include inline <style> tags.'),
  output_path: z.string().describe('Output file path (e.g., output/my-graphic.png)'),
  width: z.number().default(1200).describe('Output width in pixels'),
  height: z.number().default(630).describe('Output height in pixels'),
  format: z
    .enum(['png', 'svg', 'jpg', 'webp'])
    .default('png')
    .describe('Output format'),
});

/**
 * Register the render_graphic tool - PRIMARY MCP tool
 * Claude generates HTML/CSS, this renders it to an image
 */
export function registerRenderGraphicTool(server: McpServer, brandContext: BrandContext): void {
  server.tool(
    'render_graphic',
    'Render HTML/CSS to a branded image. PRIMARY tool for generating rich graphics with icons, gradients, shadows.',
    RenderGraphicSchema.shape,
    async (args) => {
      const input = RenderGraphicSchema.parse(args);

      try {
        // Validate output path (prevents directory traversal)
        const validatedPath = validateOutputPath(input.output_path);

        // Initialize engine
        const engine = new Engine(brandContext);
        await engine.initialize();

        // Render HTML to SVG
        const svg = await engine.renderHtml(input.html, {
          width: input.width,
          height: input.height,
        });

        // Export to final format
        const pipeline = new ExportPipeline();
        const outputBuffer = await pipeline.export(svg, input.format as OutputFormat, {
          width: input.width,
          height: input.height,
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
                output: path.resolve(input.output_path),
                format: input.format,
                width: input.width,
                height: input.height,
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

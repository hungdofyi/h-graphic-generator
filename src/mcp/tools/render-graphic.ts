import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BrandContext } from '../../core/brand-context.js';
import { Engine } from '../../core/engine.js';
import { PuppeteerRenderer } from '../../core/puppeteer-renderer.js';
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
  renderer: z
    .enum(['auto', 'satori', 'puppeteer'])
    .default('auto')
    .describe('Renderer: auto (detect), satori (simple), puppeteer (complex CSS)'),
});

/**
 * Register the render_graphic tool - PRIMARY MCP tool
 * Claude generates HTML/CSS, this renders it to an image
 * Auto-detects complex CSS (gradients, shadows) and uses Puppeteer
 */
export function registerRenderGraphicTool(server: McpServer, brandContext: BrandContext): void {
  server.tool(
    'render_graphic',
    'Render HTML/CSS to a branded image. Supports gradients, shadows, complex CSS. Auto-detects and uses best renderer.',
    RenderGraphicSchema.shape,
    async (args) => {
      const input = RenderGraphicSchema.parse(args);

      // Validate html input
      if (!input.html || typeof input.html !== 'string') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: 'HTML input is required and must be a string',
              }),
            },
          ],
          isError: true,
        };
      }

      try {
        // Validate output path (prevents directory traversal)
        const validatedPath = validateOutputPath(input.output_path);

        // Determine which renderer to use
        const usePuppeteer =
          input.renderer === 'puppeteer' ||
          (input.renderer === 'auto' && Engine.needsPuppeteer(input.html));

        let outputBuffer: Buffer;

        if (usePuppeteer) {
          // Use Puppeteer for complex CSS (gradients, shadows, grid, etc.)
          const renderer = new PuppeteerRenderer();
          await renderer.init();

          try {
            const pngBuffer = await renderer.renderToPng(input.html, {
              width: input.width,
              height: input.height,
            });

            // Convert to requested format if not PNG
            if (input.format === 'png') {
              outputBuffer = pngBuffer;
            } else {
              const pipeline = new ExportPipeline();
              // Wrap PNG in SVG for pipeline compatibility
              const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}">
                <image href="data:image/png;base64,${pngBuffer.toString('base64')}" width="${input.width}" height="${input.height}"/>
              </svg>`;
              outputBuffer = await pipeline.export(svgWrapper, input.format as OutputFormat, {
                width: input.width,
                height: input.height,
              });
            }
          } finally {
            await renderer.close();
          }
        } else {
          // Use Satori for simple CSS
          const engine = new Engine(brandContext);
          await engine.initialize();

          const svg = await engine.renderHtml(input.html, {
            width: input.width,
            height: input.height,
          });

          const pipeline = new ExportPipeline();
          outputBuffer = await pipeline.export(svg, input.format as OutputFormat, {
            width: input.width,
            height: input.height,
          });

          await engine.cleanup();
        }

        // Ensure output directory exists
        const outputDir = path.dirname(validatedPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Write output
        await fs.writeFile(validatedPath, outputBuffer);

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
                renderer: usePuppeteer ? 'puppeteer' : 'satori',
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

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BrandContext } from '../../core/brand-context.js';
import type { ExtractionLoader } from '../../core/extraction-loader.js';
import { Engine } from '../../core/engine.js';
import { PuppeteerRenderer } from '../../core/puppeteer-renderer.js';
import { ExportPipeline } from '../../core/export-pipeline.js';
import { validateOutputPath } from '../../core/sanitize.js';
import type { OutputFormat } from '../../core/types.js';
import { generatePatternCSS, injectCSS } from '../../core/pattern-css-generator.js';
import { injectBrandIcons } from '../../core/brand-icon-injector.js';

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
  style_profile: z
    .string()
    .optional()
    .describe('Pattern category to auto-inject brand CSS (e.g., "docs-diagrams", "marketing-graphics"). Injects shadows, containers, typography as utility classes.'),
  // Optional reference parameters - accepts image data for schema validation
  // Claude sees images in conversation context, these just prevent validation errors
  reference_image: z
    .string()
    .optional()
    .describe('Optional: base64 image or file path as visual reference (Claude analyzes in conversation)'),
  image: z.string().optional().describe('Alias for reference_image'),
  reference: z.string().optional().describe('Alias for reference_image'),
});

/**
 * Register the render_graphic tool - PRIMARY MCP tool
 * Claude generates HTML/CSS, this renders it to an image
 * Auto-detects complex CSS (gradients, shadows) and uses Puppeteer
 */
export function registerRenderGraphicTool(
  server: McpServer,
  brandContext: BrandContext,
  extractionLoader?: ExtractionLoader
): void {
  server.tool(
    'render_graphic',
    `Render HTML/CSS to a branded image. Supports gradients, shadows, complex CSS. Auto-detects and uses best renderer.

IMPORTANT: Before calling this tool, you MUST first:
1. Identify the graphic type (diagram, annotation, or marketing)
2. Ask clarifying questions ONE AT A TIME in a conversational flow - don't dump all questions at once
3. Confirm the final requirements before generating

Only call this tool after gathering and confirming requirements with the user.`,
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

        // Inject pattern CSS if style_profile is specified
        let htmlToRender = input.html;
        let injectedProfile: string | undefined;

        if (input.style_profile && extractionLoader) {
          const pattern = extractionLoader.getPattern(input.style_profile);
          if (pattern) {
            const patternCSS = generatePatternCSS(pattern);
            htmlToRender = injectCSS(htmlToRender, patternCSS);
            injectedProfile = input.style_profile;
          }
        }

        // Inject brand icons - replaces <brand-icon name="..."/> with actual SVGs
        const iconResult = await injectBrandIcons(htmlToRender);
        htmlToRender = iconResult.html;
        const injectedIcons = iconResult.injectedIcons;
        const iconErrors = iconResult.errors;

        // Determine which renderer to use
        const usePuppeteer =
          input.renderer === 'puppeteer' ||
          (input.renderer === 'auto' && Engine.needsPuppeteer(htmlToRender));

        let outputBuffer: Buffer;

        if (usePuppeteer) {
          // Use Puppeteer for complex CSS (gradients, shadows, grid, etc.)
          const renderer = new PuppeteerRenderer();
          await renderer.init();

          try {
            const pngBuffer = await renderer.renderToPng(htmlToRender, {
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

          const svg = await engine.renderHtml(htmlToRender, {
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
                ...(injectedProfile && { style_profile: injectedProfile }),
                ...(injectedIcons.length > 0 && { injected_icons: injectedIcons }),
                ...(iconErrors.length > 0 && { icon_errors: iconErrors }),
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

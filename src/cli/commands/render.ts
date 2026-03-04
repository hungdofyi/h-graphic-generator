import type { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import { BrandContext } from '../../core/brand-context.js';
import { Engine } from '../../core/engine.js';
import { ExportPipeline } from '../../core/export-pipeline.js';
import type { OutputFormat } from '../../core/types.js';

interface RenderOptions {
  html?: string;
  file?: string;
  output: string;
  format: string;
  size?: string;
  brand: string;
  renderer: string;
  json?: boolean;
}

export function registerRenderCommand(program: Command): void {
  program
    .command('render')
    .description('Render HTML/CSS to branded graphic (PRIMARY workflow)')
    .option('-i, --html <code>', 'HTML/CSS string to render')
    .option('-f, --file <path>', 'HTML file to render')
    .option('-o, --output <path>', 'Output file path', 'output/graphic.png')
    .option('--format <format>', 'Output format (svg|png|jpg|webp)', 'png')
    .option('-s, --size <WxH>', 'Output size (e.g., 1200x630)', '1200x630')
    .option('-b, --brand <path>', 'Brand config path', 'brand/brand.json')
    .option('-r, --renderer <type>', 'Renderer (satori|puppeteer|auto)', 'auto')
    .option('--json', 'Machine-readable JSON output')
    .action(async (options: RenderOptions) => {
      try {
        // Validate input
        if (!options.html && !options.file) {
          throw new Error('Either --html or --file is required');
        }

        // Load HTML content
        let htmlContent: string;
        if (options.file) {
          htmlContent = await fs.readFile(options.file, 'utf-8');
        } else {
          htmlContent = options.html!;
        }

        // Parse size
        const [width, height] = options.size!.split('x').map(Number);
        if (!width || !height || isNaN(width) || isNaN(height)) {
          throw new Error('Invalid size format. Use WxH (e.g., 1200x630)');
        }

        // Load brand context
        const brandContext = await BrandContext.load(options.brand);

        // Initialize engine
        const engine = new Engine(brandContext);
        await engine.initialize();

        // Render HTML to SVG
        const svg = await engine.renderHtml(htmlContent, { width, height });

        // Export to final format
        const format = options.format as OutputFormat;
        const pipeline = new ExportPipeline();
        const outputBuffer = await pipeline.export(svg, format, { width, height });

        // Ensure output directory exists
        const outputDir = path.dirname(options.output);
        await fs.mkdir(outputDir, { recursive: true });

        // Write output
        await fs.writeFile(options.output, outputBuffer);

        if (options.json) {
          console.log(
            JSON.stringify({
              success: true,
              output: path.resolve(options.output),
              format,
              width,
              height,
              size: outputBuffer.length,
            })
          );
        } else {
          console.log(pc.green('✓') + ` Rendered to ${options.output}`);
          console.log(`  Format: ${format}`);
          console.log(`  Size: ${width}x${height}`);
          console.log(`  Bytes: ${outputBuffer.length}`);
        }

        await engine.cleanup();
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: (error as Error).message }));
        } else {
          console.error(pc.red('✗') + ' Render failed');
          console.error(`  ${(error as Error).message}`);
        }
        process.exit(1);
      }
    });
}

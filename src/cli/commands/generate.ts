import type { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import { BrandContext } from '../../core/brand-context.js';
import { Engine } from '../../core/engine.js';
import { ExportPipeline } from '../../core/export-pipeline.js';
import type { OutputFormat } from '../../core/types.js';
import { registry } from '../../templates/registry.js';

interface GenerateOptions {
  template: string;
  output: string;
  format: string;
  size?: string;
  brand: string;
  props?: string;
  propsFile?: string;
  json?: boolean;
  dryRun?: boolean;
}

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate')
    .description('Generate branded graphic from template')
    .requiredOption('-t, --template <name>', 'Template name')
    .option('-o, --output <path>', 'Output file path', 'output/graphic.png')
    .option('-f, --format <format>', 'Output format (svg|png|jpg|webp)', 'png')
    .option('-s, --size <WxH>', 'Output size (e.g., 1200x630)')
    .option('-b, --brand <path>', 'Brand config path', 'brand/brand.json')
    .option('-p, --props <json>', 'Template props as JSON string')
    .option('--props-file <path>', 'Template props from JSON file')
    .option('--json', 'Machine-readable JSON output')
    .option('--dry-run', 'Preview without writing file')
    .action(async (options: GenerateOptions) => {
      try {
        // Get template
        const template = registry.get(options.template);
        if (!template) {
          const available = registry.list().map((t) => t.name);
          throw new Error(
            `Template "${options.template}" not found. Available: ${available.join(', ')}`
          );
        }

        // Load props
        let props: Record<string, unknown> = {};
        if (options.propsFile) {
          const content = await fs.readFile(options.propsFile, 'utf-8');
          props = JSON.parse(content) as Record<string, unknown>;
        } else if (options.props) {
          props = JSON.parse(options.props) as Record<string, unknown>;
        }

        // Determine size (template default or override)
        const size = options.size
          ? options.size.split('x').map(Number)
          : [template.defaultSize.width, template.defaultSize.height];
        const [width, height] = size;

        if (!width || !height || isNaN(width) || isNaN(height)) {
          throw new Error('Invalid size format. Use WxH (e.g., 1200x630)');
        }

        // Load brand context
        const brandContext = await BrandContext.load(options.brand);

        // Render template to HTML
        const html = template.render(props, brandContext.getConfig());

        if (options.dryRun) {
          if (options.json) {
            console.log(JSON.stringify({ dryRun: true, html, width, height }));
          } else {
            console.log(pc.cyan('Dry run - Generated HTML:'));
            console.log(html);
          }
          return;
        }

        // Initialize engine and render
        const engine = new Engine(brandContext);
        await engine.initialize();

        const svg = await engine.renderHtml(html, { width, height });

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
              template: options.template,
              output: path.resolve(options.output),
              format,
              width,
              height,
              size: outputBuffer.length,
            })
          );
        } else {
          console.log(pc.green('✓') + ` Generated ${options.output}`);
          console.log(`  Template: ${template.name}`);
          console.log(`  Format: ${format}`);
          console.log(`  Size: ${width}x${height}`);
        }

        await engine.cleanup();
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: (error as Error).message }));
        } else {
          console.error(pc.red('✗') + ' Generation failed');
          console.error(`  ${(error as Error).message}`);
        }
        process.exit(1);
      }
    });
}

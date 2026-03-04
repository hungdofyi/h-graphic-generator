import type { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import { BrandContext } from '../../core/brand-context.js';
import { Engine } from '../../core/engine.js';
import { ExportPipeline } from '../../core/export-pipeline.js';
import type { OutputFormat, BrandConfig } from '../../core/types.js';
import { escapeHtml } from '../../core/sanitize.js';

interface DiagramNode {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

interface DiagramInput {
  title?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  direction?: 'horizontal' | 'vertical';
}

interface DiagramOptions {
  input: string;
  output: string;
  format: string;
  size?: string;
  brand: string;
  title?: string;
  json?: boolean;
}

/**
 * Generate diagram HTML from nodes/edges
 */
function generateDiagramHtml(input: DiagramInput, brand: BrandConfig): string {
  const direction = input.direction || 'horizontal';
  const isHorizontal = direction === 'horizontal';

  const nodeHtml = input.nodes
    .map(
      (node) => `
    <div class="node" id="node-${escapeHtml(node.id)}">
      ${node.icon ? `<div class="icon">${escapeHtml(node.icon)}</div>` : ''}
      <div class="label">${escapeHtml(node.label)}</div>
      ${node.description ? `<div class="desc">${escapeHtml(node.description)}</div>` : ''}
    </div>
  `
    )
    .join(isHorizontal ? '<div class="arrow">→</div>' : '<div class="arrow">↓</div>');

  return `
    <div class="diagram">
      ${input.title ? `<h1 class="title">${escapeHtml(input.title)}</h1>` : ''}
      <div class="nodes ${direction}">
        ${nodeHtml}
      </div>
    </div>
    <style>
      .diagram {
        font-family: ${brand.typography['body']?.fontFamily || 'Inter'}, sans-serif;
        background: ${brand.colors['background']?.value || '#ffffff'};
        padding: 48px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .title {
        font-family: ${brand.typography['heading']?.fontFamily || brand.typography['body']?.fontFamily || 'Inter'}, sans-serif;
        font-size: 32px;
        font-weight: 700;
        color: ${brand.colors['text']?.value || '#1a1a1a'};
        margin-bottom: 32px;
        text-align: center;
      }
      .nodes {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .nodes.vertical {
        flex-direction: column;
      }
      .node {
        background: ${brand.colors['surface']?.value || '#f8f9fa'};
        border: 2px solid ${brand.colors['primary']?.value || '#3b82f6'};
        border-radius: ${brand.spacing?.unit || 8}px;
        padding: 20px 28px;
        text-align: center;
        min-width: 120px;
      }
      .icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      .label {
        font-weight: 600;
        font-size: 16px;
        color: ${brand.colors['text']?.value || '#1a1a1a'};
      }
      .desc {
        font-size: 12px;
        color: ${brand.colors['muted']?.value || '#6b7280'};
        margin-top: 4px;
      }
      .arrow {
        font-size: 24px;
        color: ${brand.colors['primary']?.value || '#3b82f6'};
        font-weight: bold;
      }
    </style>
  `;
}

export function registerDiagramCommand(program: Command): void {
  program
    .command('diagram')
    .description('Generate branded diagram from JSON nodes/edges')
    .requiredOption('-i, --input <file>', 'Input JSON file with nodes/edges')
    .option('-o, --output <path>', 'Output file path', 'output/diagram.png')
    .option('-f, --format <format>', 'Output format (svg|png|jpg|webp)', 'png')
    .option('-s, --size <WxH>', 'Output size (e.g., 1200x630)', '1200x630')
    .option('-b, --brand <path>', 'Brand config path', 'brand/brand.json')
    .option('--title <text>', 'Diagram title (overrides JSON)')
    .option('--json', 'Machine-readable JSON output')
    .action(async (options: DiagramOptions) => {
      try {
        // Load diagram input
        const inputContent = await fs.readFile(options.input, 'utf-8');
        const diagramInput = JSON.parse(inputContent) as DiagramInput;

        // Override title if provided
        if (options.title) {
          diagramInput.title = options.title;
        }

        // Validate input
        if (!diagramInput.nodes || diagramInput.nodes.length === 0) {
          throw new Error('Diagram must have at least one node');
        }

        // Parse size
        const [width, height] = options.size!.split('x').map(Number);
        if (!width || !height || isNaN(width) || isNaN(height)) {
          throw new Error('Invalid size format. Use WxH (e.g., 1200x630)');
        }

        // Load brand context
        const brandContext = await BrandContext.load(options.brand);

        // Generate diagram HTML
        const html = generateDiagramHtml(diagramInput, brandContext.getConfig());

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
              output: path.resolve(options.output),
              format,
              width,
              height,
              nodes: diagramInput.nodes.length,
              edges: diagramInput.edges?.length || 0,
            })
          );
        } else {
          console.log(pc.green('✓') + ` Generated diagram: ${options.output}`);
          console.log(`  Nodes: ${diagramInput.nodes.length}`);
          console.log(`  Format: ${format}`);
          console.log(`  Size: ${width}x${height}`);
        }

        await engine.cleanup();
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: (error as Error).message }));
        } else {
          console.error(pc.red('✗') + ' Diagram generation failed');
          console.error(`  ${(error as Error).message}`);
        }
        process.exit(1);
      }
    });
}

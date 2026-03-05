import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ExtractionLoader } from '../../core/extraction-loader.js';

/**
 * MCP tool to list available style libraries from Figma extractions
 */
export function registerListPatternsTool(
  server: McpServer,
  extractionLoader: ExtractionLoader
): void {
  server.tool(
    'list_patterns',
    'List available style libraries extracted from Figma. Returns categories with style counts. Use to discover available graphic styles before generating.',
    {
      category: z.string().optional().describe(
        'Filter by category (e.g., "marketing-graphics", "docs-explainers")'
      ),
    },
    async (args) => {
      const patterns = args.category
        ? extractionLoader.listPatternsByCategory(args.category)
        : extractionLoader.listPatterns();

      const categories = extractionLoader.getCategories();

      // Calculate totals
      const totals = {
        backgrounds: 0,
        containers: 0,
        typography: 0,
        graphicElements: 0,
        chartElements: 0,
        layoutPatterns: 0,
      };

      for (const p of patterns) {
        totals.backgrounds += p.stylesCount.backgrounds;
        totals.containers += p.stylesCount.containers;
        totals.typography += p.stylesCount.typography;
        totals.graphicElements += p.stylesCount.graphicElements;
        totals.chartElements += p.stylesCount.chartElements;
        totals.layoutPatterns += p.stylesCount.layoutPatterns;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            categories,
            libraries: patterns,
            totals,
            svgBasePath: 'brand/extracted/svg-templates/',
          }, null, 2),
        }],
      };
    }
  );
}

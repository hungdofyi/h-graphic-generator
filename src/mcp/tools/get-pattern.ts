import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ExtractionLoader } from '../../core/extraction-loader.js';
import type { PatternEntry } from '../../core/extraction-types.js';

/**
 * Generate usage guidance for a style library
 */
function generateUsageGuidance(pattern: PatternEntry): string {
  const lines: string[] = [];

  lines.push(`Style Library: ${pattern.name}`);
  lines.push(`Category: ${pattern.category}`);

  const counts = {
    backgrounds: Object.keys(pattern.styles.backgrounds).length,
    shadows: Object.keys(pattern.styles.shadows).length,
    containers: Object.keys(pattern.styles.containers).length,
    typography: Object.keys(pattern.styles.typography).length,
    graphicElements: Object.keys(pattern.styles.graphicElements).length,
    chartElements: Object.keys(pattern.styles.chartElements).length,
    layoutPatterns: Object.keys(pattern.layoutPatterns).length,
  };

  lines.push('');
  lines.push('Available styles:');
  if (counts.backgrounds > 0) lines.push(`  - ${counts.backgrounds} backgrounds`);
  if (counts.shadows > 0) lines.push(`  - ${counts.shadows} shadows`);
  if (counts.containers > 0) lines.push(`  - ${counts.containers} containers`);
  if (counts.typography > 0) lines.push(`  - ${counts.typography} typography styles`);
  if (counts.graphicElements > 0) lines.push(`  - ${counts.graphicElements} graphic elements`);
  if (counts.chartElements > 0) lines.push(`  - ${counts.chartElements} chart elements`);
  if (counts.layoutPatterns > 0) lines.push(`  - ${counts.layoutPatterns} layout patterns`);

  if (pattern.svgTemplates) {
    const svgCount = Object.keys(pattern.svgTemplates.files).length;
    lines.push(`  - ${svgCount} SVG templates in ${pattern.svgTemplates.location}`);
  }

  return lines.join('\n');
}

/**
 * MCP tool to get detailed styling for a specific category
 */
export function registerGetPatternTool(
  server: McpServer,
  extractionLoader: ExtractionLoader
): void {
  server.tool(
    'get_pattern',
    'Get detailed styling for a style library category. Returns backgrounds, containers, typography, graphic elements, chart elements, layout patterns, and SVG templates. Use after list_patterns to get full details.',
    {
      category: z.string().describe('Category name (e.g., "marketing-graphics", "docs-explainers")'),
    },
    async (args) => {
      const pattern = extractionLoader.getPattern(args.category);

      if (!pattern) {
        const categories = extractionLoader.getCategories();
        const suggestions = categories.filter(
          c => c.includes(args.category) || args.category.includes(c.slice(0, 5))
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Category "${args.category}" not found`,
              availableCategories: categories,
              suggestions: suggestions.length > 0 ? suggestions : undefined,
            }),
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...pattern,
            usageGuidance: generateUsageGuidance(pattern),
          }, null, 2),
        }],
      };
    }
  );
}

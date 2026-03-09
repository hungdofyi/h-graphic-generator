import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ExtractionLoader } from '../../core/extraction-loader.js';
import type { ComponentLoader } from '../../core/component-loader.js';

/**
 * MCP tool to list available style libraries, components, and recipes
 */
export function registerListPatternsTool(
  server: McpServer,
  extractionLoader?: ExtractionLoader,
  componentLoader?: ComponentLoader
): void {
  server.tool(
    'list_patterns',
    'List available style libraries, components, and recipes. Returns categories with counts. Use to discover available graphic styles before generating.',
    {
      category: z.string().optional().describe(
        'Filter by category (e.g., "marketing-graphics", "diagrams", "nodes")'
      ),
      type: z.enum(['all', 'styles', 'components', 'recipes']).optional().describe(
        'Filter by type: styles (v2 extractions), components (composable system), recipes (composition guides)'
      ),
    },
    async (args) => {
      const result: Record<string, unknown> = {};
      const filterType = args.type || 'all';

      // V2 Style Libraries (existing extractions)
      if (extractionLoader && (filterType === 'all' || filterType === 'styles')) {
        const patterns = args.category
          ? extractionLoader.listPatternsByCategory(args.category)
          : extractionLoader.listPatterns();

        const categories = extractionLoader.getCategories();

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

        result.styleLibraries = {
          categories,
          libraries: patterns,
          totals,
          svgBasePath: 'brand/extracted/svg-templates/',
        };
      }

      // Composable Components (Option B architecture)
      if (componentLoader && (filterType === 'all' || filterType === 'components')) {
        const components = args.category
          ? componentLoader.listComponentsByCategory(args.category)
          : componentLoader.listComponents();

        const componentCategories = componentLoader.getComponentCategories();

        result.components = {
          categories: componentCategories,
          items: components,
          total: components.length,
          svgBasePath: 'brand/svg/',
        };
      }

      // Recipes (composition guides)
      if (componentLoader && (filterType === 'all' || filterType === 'recipes')) {
        const recipes = args.category
          ? componentLoader.listRecipesByCategory(args.category)
          : componentLoader.listRecipes();

        const recipeCategories = componentLoader.getRecipeCategories();

        result.recipes = {
          categories: recipeCategories,
          items: recipes,
          total: recipes.length,
        };
      }

      // Add color guidance
      result.colorNotes = {
        primary: 'Green scale (green.50-900) - main brand accent',
        secondary: ['Blue scale (blue.50-800)', 'Purple scale (purple.50-900)'],
        darkBackground: 'Navy (blue.900) - primary dark background for marketing',
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ExtractionLoader } from '../../core/extraction-loader.js';
import type { ComponentLoader } from '../../core/component-loader.js';
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
 * MCP tool to get detailed styling, components, or recipes
 */
export function registerGetPatternTool(
  server: McpServer,
  extractionLoader?: ExtractionLoader,
  componentLoader?: ComponentLoader
): void {
  server.tool(
    'get_pattern',
    'Get detailed styling for a category, component, or recipe. For style libraries use category name (e.g., "marketing-graphics"). For components use "component:category/name" (e.g., "component:nodes/box"). For recipes use "recipe:category/name" (e.g., "recipe:diagrams/architecture-flow").',
    {
      category: z.string().describe('Category/component/recipe path. Prefix with "component:" or "recipe:" for composable system.'),
    },
    async (args) => {
      const query = args.category;

      // Handle component queries
      if (query.startsWith('component:')) {
        if (!componentLoader) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: 'Component system not loaded' }),
            }],
            isError: true,
          };
        }

        const componentKey = query.replace('component:', '');
        const component = componentLoader.getComponent(componentKey);

        if (!component) {
          const available = componentLoader.listComponents();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Component "${componentKey}" not found`,
                availableComponents: available.map(c => `${c.category}/${c.name}`),
              }),
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              type: 'component',
              ...component,
              colorNotes: {
                primary: 'Green scale (green.50-900) - main brand accent',
                secondary: ['Blue scale (blue.50-800)', 'Purple scale (purple.50-900)'],
              },
            }, null, 2),
          }],
        };
      }

      // Handle recipe queries
      if (query.startsWith('recipe:')) {
        if (!componentLoader) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: 'Recipe system not loaded' }),
            }],
            isError: true,
          };
        }

        const recipeKey = query.replace('recipe:', '');
        const recipe = componentLoader.getRecipe(recipeKey);

        if (!recipe) {
          const available = componentLoader.listRecipes();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Recipe "${recipeKey}" not found`,
                availableRecipes: available.map(r => `${r.category}/${r.name}`),
              }),
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              type: 'recipe',
              name: recipe.name,
              category: recipe.category,
              content: recipe.content,
            }, null, 2),
          }],
        };
      }

      // Handle style library queries (default, backward compatible)
      if (!extractionLoader) {
        // Try to find as component category
        if (componentLoader) {
          const components = componentLoader.listComponentsByCategory(query);
          if (components.length > 0) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  type: 'componentCategory',
                  category: query,
                  components: components,
                  hint: 'Use "component:category/name" to get full component details',
                }, null, 2),
              }],
            };
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'Extraction loader not available' }),
          }],
          isError: true,
        };
      }

      const pattern = extractionLoader.getPattern(query);

      if (!pattern) {
        const categories = extractionLoader.getCategories();
        const componentCategories = componentLoader?.getComponentCategories() || [];
        const recipeCategories = componentLoader?.getRecipeCategories() || [];

        const suggestions = categories.filter(
          c => c.includes(query) || query.includes(c.slice(0, 5))
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Category "${query}" not found`,
              availableStyleCategories: categories,
              availableComponentCategories: componentCategories,
              availableRecipeCategories: recipeCategories,
              suggestions: suggestions.length > 0 ? suggestions : undefined,
              hint: 'Use "component:category/name" for components or "recipe:category/name" for recipes',
            }),
          }],
          isError: true,
        };
      }

      // Include related components if available
      const relatedComponents = componentLoader
        ? componentLoader.listComponents().filter(c =>
            query.includes(c.category) || c.category.includes(query.split('-')[0])
          )
        : [];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: 'styleLibrary',
            ...pattern,
            usageGuidance: generateUsageGuidance(pattern),
            relatedComponents: relatedComponents.length > 0 ? relatedComponents : undefined,
            colorNotes: {
              primary: 'Green scale (green.50-900) - main brand accent',
              secondary: ['Blue scale (blue.50-800)', 'Purple scale (purple.50-900)'],
            },
          }, null, 2),
        }],
      };
    }
  );
}

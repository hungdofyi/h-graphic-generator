import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const SuggestPatternsSchema = z.object({
  request: z.string().describe('The user request for graphic generation'),
});

/**
 * Keyword to pattern mapping for smart pattern suggestion
 */
const KEYWORD_PATTERNS: Record<string, { recipes: string[]; components: string[]; icons: string[] }> = {
  // Comparison/Before-After patterns
  comparison: {
    recipes: ['marketing/before-after'],
    components: ['decorative/arrows'],
    icons: [],
  },
  'before-after': {
    recipes: ['marketing/before-after'],
    components: [],
    icons: [],
  },
  versus: {
    recipes: ['marketing/before-after'],
    components: ['decorative/arrows'],
    icons: [],
  },
  vs: {
    recipes: ['marketing/before-after'],
    components: ['decorative/arrows'],
    icons: [],
  },

  // Flow/Architecture patterns
  flow: {
    recipes: ['diagrams/data-flow', 'diagrams/architecture-flow'],
    components: ['connectors/elbow', 'connectors/straight', 'nodes/box'],
    icons: ['arrow-right', 'arrow-down'],
  },
  architecture: {
    recipes: ['diagrams/architecture-flow'],
    components: ['connectors/elbow', 'nodes/box', 'connectors/branch'],
    icons: ['database', 'dashboard'],
  },
  pipeline: {
    recipes: ['diagrams/data-flow'],
    components: ['connectors/straight', 'nodes/box', 'decorative/arrows'],
    icons: ['arrow-right'],
  },
  diagram: {
    recipes: ['diagrams/architecture-flow', 'diagrams/data-flow'],
    components: ['connectors/elbow', 'nodes/box'],
    icons: [],
  },

  // Data/Database patterns
  data: {
    recipes: ['diagrams/data-flow'],
    components: ['connectors/elbow', 'nodes/box'],
    icons: ['database'],
  },
  database: {
    recipes: ['diagrams/architecture-flow'],
    components: ['nodes/box', 'connectors/elbow'],
    icons: ['database'],
  },
  bi: {
    recipes: ['diagrams/architecture-flow'],
    components: ['nodes/box', 'connectors/elbow'],
    icons: ['database', 'dashboard'],
  },
  analytics: {
    recipes: ['diagrams/data-flow'],
    components: ['nodes/box'],
    icons: ['dashboard'],
  },

  // Marketing patterns
  feature: {
    recipes: ['marketing/spotlight-feature', 'marketing/layered-showcase'],
    components: ['containers/frosted-card'],
    icons: [],
  },
  showcase: {
    recipes: ['marketing/layered-showcase', 'marketing/spotlight-feature'],
    components: ['layouts/stacked-cards', 'containers/dashboard-mockup'],
    icons: [],
  },
  spotlight: {
    recipes: ['marketing/spotlight-feature'],
    components: ['highlights/spotlight', 'decorative/cursors'],
    icons: [],
  },
  config: {
    recipes: ['marketing/config-preview'],
    components: ['containers/code-block'],
    icons: [],
  },
  network: {
    recipes: ['marketing/radial-network'],
    components: ['layouts/radial-network', 'connectors/straight'],
    icons: [],
  },

  // Annotation patterns
  screenshot: {
    recipes: ['annotations/screenshot-highlight'],
    components: ['highlights/screenshot-overlay', 'containers/tooltip'],
    icons: ['cursor'],
  },
  highlight: {
    recipes: ['annotations/screenshot-highlight'],
    components: ['highlights/spotlight', 'highlights/code-highlight'],
    icons: [],
  },
  annotation: {
    recipes: ['annotations/screenshot-highlight'],
    components: ['containers/tooltip', 'highlights/spotlight'],
    icons: ['cursor'],
  },

  // Connection/Relationship patterns
  connect: {
    recipes: ['diagrams/architecture-flow'],
    components: ['connectors/elbow', 'connectors/straight', 'nodes/connection-dot'],
    icons: [],
  },
  relationship: {
    recipes: ['diagrams/architecture-flow'],
    components: ['connectors/elbow', 'connectors/branch'],
    icons: [],
  },
  integration: {
    recipes: ['diagrams/architecture-flow'],
    components: ['connectors/elbow', 'nodes/box'],
    icons: ['database'],
  },

  // Layer/Stack patterns
  layer: {
    recipes: ['marketing/layered-showcase'],
    components: ['layouts/layered-windows', 'layouts/stacked-cards'],
    icons: [],
  },
  stack: {
    recipes: ['marketing/layered-showcase'],
    components: ['layouts/stacked-cards'],
    icons: [],
  },
};

/**
 * Analyze request and suggest relevant patterns
 */
function analyzeRequest(request: string): {
  recipes: string[];
  components: string[];
  icons: string[];
} {
  const lowerRequest = request.toLowerCase();
  const recipes = new Set<string>();
  const components = new Set<string>();
  const icons = new Set<string>();

  // Check each keyword
  for (const [keyword, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    if (lowerRequest.includes(keyword)) {
      patterns.recipes.forEach((r) => recipes.add(r));
      patterns.components.forEach((c) => components.add(c));
      patterns.icons.forEach((i) => icons.add(i));
    }
  }

  // If no matches, suggest general patterns based on common needs
  if (recipes.size === 0) {
    // Default to marketing spotlight if nothing else matches
    recipes.add('marketing/spotlight-feature');
  }

  return {
    recipes: Array.from(recipes),
    components: Array.from(components),
    icons: Array.from(icons),
  };
}

/**
 * Register suggest_patterns tool - analyzes request and suggests relevant patterns
 */
export function registerSuggestPatternsTool(server: McpServer): void {
  server.tool(
    'suggest_patterns',
    'Analyze a graphic request and suggest ALL relevant recipes, components, and icons. Call this FIRST before get_pattern to ensure you use the right combination of patterns.',
    SuggestPatternsSchema.shape,
    async (args) => {
      const input = SuggestPatternsSchema.parse(args);
      const suggestions = analyzeRequest(input.request);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              request: input.request,
              suggestions,
              usage: {
                recipes: 'Call get_pattern("recipe:category/name") for each recipe',
                components: 'Call get_pattern("component:category/name") for each component',
                icons: 'Call get_icon("name") or list_icons to get SVG content',
              },
              note: 'Combine multiple patterns for complex graphics. Marketing graphics often need diagram components (connectors, nodes) for data flows.',
            }),
          },
        ],
      };
    }
  );
}

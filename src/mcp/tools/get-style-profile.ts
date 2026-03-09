import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BrandContext } from '../../core/brand-context.js';

const GetStyleProfileSchema = z.object({});

// Creative guidance - surfaced directly to AI
const CREATIVE_GUIDANCE = {
  criticalRules: {
    typography: {
      rule: 'Sentence case ONLY - NEVER use ALL CAPS or text-transform: uppercase',
      exceptions: ['Region codes (NA, EU, APAC)', 'Acronyms as proper nouns (API, SQL)'],
    },
    doNotAdd: [
      'Browser chrome (macOS window dots red/yellow/green, title bars)',
      'Fake browser UI or window decorations',
      'OS/system emojis (🔒📊💡) - use brand icons or CSS shapes',
      'Decorative elements not specified in brand system',
    ],
    layoutSafety: {
      rule: 'Calculate heights BEFORE writing CSS',
      requirements: [
        'Sum all sections (header + content + footer + padding)',
        'Total must be ≤ canvas height',
        'Reserve 32-48px bottom padding minimum',
        'Use explicit pixel heights, not flex: 1',
        'No negative positioning (top: -12px causes clipping)',
      ],
    },
  },
  docsVsMarketing: {
    docs: {
      background: 'White/transparent',
      borders: '1px, subtle',
      borderRadius: '6-8px',
      typography: '18-25px',
      effects: 'Flat, minimal',
    },
    marketing: {
      background: 'Navy gradients (blue.900), mesh',
      borders: '2-3px, prominent',
      borderRadius: '11-20px',
      typography: '35-45px',
      effects: 'Blur, glows, gradients',
    },
    rule: 'Never mix docs and marketing styles in one graphic',
  },
  preRenderChecklist: [
    'Sentence case only (no ALL CAPS)',
    'No browser chrome or fake window UI',
    'Height calculated and fits canvas',
    'Bottom padding ≥ 32px',
    'No negative positioning on badges',
    'Colors use brand tokens (green.X, blue.X, gray.X)',
    'Consistent border radius throughout',
  ],
};

/**
 * Register the get_style_profile tool
 * Returns the official brand guidelines from brand.json plus creative guidance
 */
export function registerGetStyleProfileTool(server: McpServer, brandContext: BrandContext): void {
  server.tool(
    'get_style_profile',
    'Get official brand guidelines including color scales, typography, spacing, design principles, AND creative guidance with critical rules. Use this as the source of truth before generating graphics.',
    GetStyleProfileSchema.shape,
    async () => {
      try {
        const config = brandContext.getConfig();

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                // Creative guidance FIRST so it's seen immediately
                creativeGuidance: CREATIVE_GUIDANCE,
                brand: config.name,
                colors: {
                  primary: config.colors.primary,
                  secondary: config.colors.secondary,
                  text: config.colors.text,
                  muted: config.colors.muted,
                  background: config.colors.background,
                  scales: config.colors.scales,
                  rules: config.colors.rules,
                },
                typography: config.typography,
                spacing: config.spacing,
                illustration: config.illustration,
                diagram: config.diagram,
                logo: {
                  variants: config.logo?.variants,
                  rules: config.logo?.rules,
                },
                usage: {
                  colors: 'Use scales (green.50-900, blue.50-900, gray.50-900) for consistent theming',
                  typography: 'Inter for UI, JetBrains Mono for code',
                  spacing: 'Base unit 8px, use scales (xs:4, sm:8, md:16, lg:24, xl:32)',
                },
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
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

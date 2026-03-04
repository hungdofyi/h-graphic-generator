import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BrandContext } from '../../core/brand-context.js';

const GetStyleProfileSchema = z.object({});

/**
 * Register the get_style_profile tool
 * Returns the style profile that teaches Claude HOW to apply brand tokens
 */
export function registerGetStyleProfileTool(server: McpServer, brandContext: BrandContext): void {
  server.tool(
    'get_style_profile',
    'Get the brand style profile that describes HOW to apply colors, typography, and design patterns. Use this to understand visual design rules before generating HTML/CSS.',
    GetStyleProfileSchema.shape,
    async () => {
      try {
        // Load style profile if not already loaded
        const profile = await brandContext.loadStyleProfile();

        if (!profile) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error:
                    'No style profile found. Run `hgraphic brand extract-style` to generate one from reference images.',
                }),
              },
            ],
            isError: true,
          };
        }

        // Return profile with usage guidance
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                profile: {
                  global: profile.global,
                  categories: profile.categories,
                },
                usage_guidance: {
                  colorApplication:
                    'Follow these patterns for how to use primary, accent, and background colors',
                  typographyHierarchy: 'Apply these heading and body text styles',
                  spacingRhythm: 'Use this spacing approach for consistent layouts',
                  decorativeElements: 'Include these design elements where appropriate',
                  illustrationStyle: 'Match this visual style for graphics and icons',
                },
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

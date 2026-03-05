import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BrandContext } from '../../core/brand-context.js';

const GetStyleProfileSchema = z.object({});

/**
 * Register the get_style_profile tool
 * Returns the official brand guidelines from brand.json
 */
export function registerGetStyleProfileTool(server: McpServer, brandContext: BrandContext): void {
  server.tool(
    'get_style_profile',
    'Get official brand guidelines including color scales, typography, spacing, and design principles. Use this as the source of truth for brand tokens before generating graphics.',
    GetStyleProfileSchema.shape,
    async () => {
      try {
        const config = brandContext.getConfig();

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
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

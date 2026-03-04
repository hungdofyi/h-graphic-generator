import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BrandContext } from '../../core/brand-context.js';

const ValidateBrandSchema = z.object({});

/**
 * Register the validate_brand tool
 * Validates that brand config is properly loaded
 */
export function registerValidateBrandTool(server: McpServer, brandContext: BrandContext): void {
  server.tool(
    'validate_brand',
    'Validate that brand configuration is loaded and return available tokens',
    ValidateBrandSchema.shape,
    async () => {
      try {
        const config = brandContext.getConfig();

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                brand: {
                  name: config.name,
                  colors: Object.fromEntries(
                    Object.entries(config.colors).map(([k, v]) => [k, v.value])
                  ),
                  typography: Object.fromEntries(
                    Object.entries(config.typography).map(([k, v]) => [
                      k,
                      { fontFamily: v.fontFamily, fontSize: v.fontSize, fontWeight: v.fontWeight },
                    ])
                  ),
                  spacing: config.spacing,
                  assets: Object.keys(config.assets),
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

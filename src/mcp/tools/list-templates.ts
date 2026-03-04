import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { registry } from '../../templates/registry.js';
import type { TemplateCategory } from '../../core/types.js';

const ListTemplatesSchema = z.object({
  category: z
    .enum(['illustration', 'diagram', 'social', 'presentation'])
    .optional()
    .describe('Filter by category'),
});

/**
 * Register the list_templates tool
 * Discovery tool for available templates
 */
export function registerListTemplatesTool(server: McpServer): void {
  server.tool(
    'list_templates',
    'List available templates for generate_from_template tool',
    ListTemplatesSchema.shape,
    async (args) => {
      const input = ListTemplatesSchema.parse(args);

      const templates = registry.list(input.category as TemplateCategory | undefined);

      const templateInfo = templates.map((t) => ({
        name: t.name,
        description: t.description,
        category: t.category,
        defaultSize: t.defaultSize,
        requiredProps: Object.entries(t.props || {})
          .filter(([, v]) => v.required)
          .map(([k]) => k),
        optionalProps: Object.entries(t.props || {})
          .filter(([, v]) => !v.required)
          .map(([k]) => k),
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              count: templateInfo.length,
              templates: templateInfo,
            }),
          },
        ],
      };
    }
  );
}

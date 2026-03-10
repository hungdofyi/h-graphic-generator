import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

const ICONS_DIR = 'brand/data/icons';
const SVG_DIR = 'brand/svg';

/**
 * Semantic aliases for common icon requests
 * Maps user-friendly names to actual SVG paths
 */
const ICON_ALIASES: Record<string, string> = {
  'database': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'data-warehouse': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'warehouse': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'user': 'brand/svg/diagram-icons/icon-user-head.svg',
  'user-head': 'brand/svg/diagram-icons/icon-user-head.svg',
  'user-body': 'brand/svg/diagram-icons/icon-user-body.svg',
  'dashboard': 'brand/svg/diagram-icons/icon-dashboard.svg',
  'cursor': 'brand/svg/decorative/cursor.svg',
  'pointer': 'brand/svg/decorative/cursor.svg',
  'arrow-right': 'brand/svg/arrows/diagram-arrow-horizontal.svg',
  'arrow-horizontal': 'brand/svg/arrows/diagram-arrow-horizontal.svg',
  'arrow-down': 'brand/svg/arrows/arrow-b.svg',
  'arrow-up': 'brand/svg/arrows/arrow-t.svg',
  'arrow-curved': 'brand/svg/arrows/diagram-arrow-curved.svg',
  'checkmark': 'brand/svg/diagram-icons/explainer-icon-checkmark.svg',
  'file': 'brand/svg/diagram-icons/explainer-icon-file.svg',
  'connection-dot': 'brand/svg/diagram-nodes/diagram-connection-dot.svg',
  'step-circle': 'brand/svg/diagram-nodes/explainer-step-circle.svg',
};

/**
 * Extract CSS variable names from SVG content for customization guidance
 */
function extractCssVariables(svgContent: string): string[] {
  const varRegex = /var\(--([^,)]+)/g;
  const variables = new Set<string>();
  let match;
  while ((match = varRegex.exec(svgContent)) !== null) {
    if (match[1]) {
      variables.add(`--${match[1].trim()}`);
    }
  }
  return [...variables];
}

/**
 * MCP tool to get actual SVG content for icons
 * Returns embeddable SVG markup, not just paths
 */
export function registerGetIconTool(server: McpServer): void {
  server.tool(
    'get_icon',
    'Get actual SVG content for an icon. Use semantic names (database, cursor, arrow-right) or paths (chart/bar-chart). Returns embeddable SVG markup.',
    {
      name: z.string().describe('Icon name (e.g., "database", "cursor") or path (e.g., "chart/bar-chart")'),
    },
    async (args) => {
      try {
        let svgPath: string;
        let resolvedName = args.name;

        // Check aliases first for semantic names
        if (ICON_ALIASES[args.name]) {
          svgPath = path.resolve(ICON_ALIASES[args.name]);
          resolvedName = args.name;
        } else {
          // Try multiple locations in order of preference
          const searchPaths = [
            // Direct path in brand/data/icons/
            path.resolve(ICONS_DIR, `${args.name}.svg`),
            // Category/name format in brand/data/icons/
            path.resolve(ICONS_DIR, args.name.includes('/') ? `${args.name}.svg` : `${args.name}.svg`),
            // Direct path in brand/svg/
            path.resolve(SVG_DIR, `${args.name}.svg`),
            // Category/name format in brand/svg/
            path.resolve(SVG_DIR, args.name.includes('/') ? `${args.name}.svg` : `diagram-icons/${args.name}.svg`),
          ];

          let found = false;
          for (const searchPath of searchPaths) {
            try {
              await fs.access(searchPath);
              svgPath = searchPath;
              found = true;
              break;
            } catch {
              continue;
            }
          }

          if (!found) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  error: `Icon "${args.name}" not found`,
                  availableAliases: Object.keys(ICON_ALIASES),
                  searchedPaths: searchPaths.map(p => p.replace(process.cwd() + '/', '')),
                  hint: 'Use list_icons to discover available icons, or use an alias like "database", "cursor", "arrow-right"',
                }, null, 2),
              }],
              isError: true,
            };
          }
        }

        const content = await fs.readFile(svgPath!, 'utf-8');
        const cssVariables = extractCssVariables(content);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              name: resolvedName,
              path: svgPath!.replace(process.cwd() + '/', ''),
              svgContent: content.trim(),
              cssVariables: cssVariables.length > 0 ? cssVariables : undefined,
              usage: cssVariables.length > 0
                ? `Embed SVG directly. Customize with CSS variables: ${cssVariables.join(', ')}`
                : 'Embed this SVG directly in your HTML.',
              example: `<div style="width: 40px; height: 40px;">\n  <!-- paste svgContent here -->\n</div>`,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Failed to read icon: ${error instanceof Error ? error.message : 'Unknown error'}`,
              hint: 'Use list_icons to discover available icons',
            }),
          }],
          isError: true,
        };
      }
    }
  );
}

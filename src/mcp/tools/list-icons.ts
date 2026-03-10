import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

const ICONS_DIR = 'brand/data/icons';

/**
 * Recursively list all SVG icons in a directory
 */
async function listIconsInDir(dir: string, prefix = ''): Promise<string[]> {
  const icons: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subIcons = await listIconsInDir(
        path.join(dir, entry.name),
        prefix ? `${prefix}/${entry.name}` : entry.name
      );
      icons.push(...subIcons);
    } else if (entry.name.endsWith('.svg')) {
      const iconName = entry.name.replace('.svg', '');
      icons.push(prefix ? `${prefix}/${iconName}` : iconName);
    }
  }

  return icons;
}

/**
 * Get icon categories (subdirectories)
 */
async function getCategories(dir: string): Promise<{ name: string; count: number }[]> {
  const categories: { name: string; count: number }[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  // Count root icons
  const rootIcons = entries.filter(e => e.isFile() && e.name.endsWith('.svg'));
  if (rootIcons.length > 0) {
    categories.push({ name: 'root', count: rootIcons.length });
  }

  // Count category icons
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subEntries = await fs.readdir(path.join(dir, entry.name));
      const svgCount = subEntries.filter(f => f.endsWith('.svg')).length;
      if (svgCount > 0) {
        categories.push({ name: entry.name, count: svgCount });
      }
    }
  }

  return categories.sort((a, b) => b.count - a.count);
}

/**
 * MCP tool to list available brand UI icons from brand/data/icons
 *
 * For diagram elements (cursors, arrows, shapes), use get_icon with semantic names
 * or get_pattern("component:decorative/...") for styling guidance
 */
export function registerListIconsTool(server: McpServer): void {
  server.tool(
    'list_icons',
    'List brand UI icons from brand/data/icons (300+ icons by category). For diagram elements (cursors, arrows, database shapes), use get_icon with semantic names like "cursor", "database", "arrow-right" instead.',
    {
      category: z.string().optional().describe(
        'Filter by category (e.g., "chart", "ds", "ai", "onboarding"). Omit to list all.'
      ),
    },
    async (args) => {
      try {
        const iconsDir = path.resolve(ICONS_DIR);
        const categories = await getCategories(iconsDir);

        let icons: string[];
        if (args.category) {
          const categoryDir = args.category === 'root'
            ? iconsDir
            : path.join(iconsDir, args.category);

          try {
            const entries = await fs.readdir(categoryDir);
            icons = entries
              .filter(f => f.endsWith('.svg'))
              .map(f => args.category === 'root' ? f.replace('.svg', '') : `${args.category}/${f.replace('.svg', '')}`);
          } catch {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  error: `Category "${args.category}" not found`,
                  availableCategories: categories.map(c => c.name),
                }),
              }],
              isError: true,
            };
          }
        } else {
          icons = await listIconsInDir(iconsDir);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              categories,
              totalIcons: icons.length,
              icons: icons.sort(),
              basePath: ICONS_DIR,
              usage: {
                path: 'Use icon names with .svg extension, e.g., "chart/bar-chart.svg"',
                sizing: 'Icons are SVG and can be ANY size. Scale freely with width/height.',
                examples: {
                  small: '16-24px for inline/UI icons',
                  medium: '32-64px for feature icons',
                  large: '80-200px for hero/decorative icons',
                  custom: 'Any size works - SVGs scale without quality loss',
                },
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: (error as Error).message }),
          }],
          isError: true,
        };
      }
    }
  );
}

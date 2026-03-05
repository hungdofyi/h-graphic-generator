import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BrandContext } from '../../core/brand-context.js';

export function registerResources(server: McpServer, brandContext: BrandContext): void {
  // Brand config resource - full brand.json
  server.resource(
    'brand://config',
    'brand://config',
    async () => {
      const config = brandContext.getConfig();
      return {
        contents: [{
          uri: 'brand://config',
          mimeType: 'application/json',
          text: JSON.stringify(config, null, 2),
        }],
      };
    }
  );

  // Color scales resource - just the color system
  server.resource(
    'brand://colors',
    'brand://colors',
    async () => {
      const config = brandContext.getConfig();
      const colors = {
        primary: config.colors.primary,
        secondary: config.colors.secondary,
        text: config.colors.text,
        muted: config.colors.muted,
        background: config.colors.background,
        scales: config.colors.scales,
      };
      return {
        contents: [{
          uri: 'brand://colors',
          mimeType: 'application/json',
          text: JSON.stringify(colors, null, 2),
        }],
      };
    }
  );

  // Typography resource
  server.resource(
    'brand://typography',
    'brand://typography',
    async () => {
      const config = brandContext.getConfig();
      return {
        contents: [{
          uri: 'brand://typography',
          mimeType: 'application/json',
          text: JSON.stringify(config.typography, null, 2),
        }],
      };
    }
  );

  // CSS variables helper - generates CSS custom properties from brand tokens
  server.resource(
    'brand://css-variables',
    'brand://css-variables',
    async () => {
      const config = brandContext.getConfig();
      const lines: string[] = [':root {'];

      // Primary colors
      lines.push(`  --color-primary: ${config.colors.primary?.value};`);
      lines.push(`  --color-secondary: ${config.colors.secondary?.value};`);
      lines.push(`  --color-text: ${config.colors.text?.value};`);
      lines.push(`  --color-muted: ${config.colors.muted?.value};`);
      lines.push(`  --color-background: ${config.colors.background?.value};`);
      lines.push('');

      // Color scales
      for (const [scaleName, scale] of Object.entries(config.colors.scales || {})) {
        for (const [shade, value] of Object.entries(scale as Record<string, string>)) {
          lines.push(`  --color-${scaleName}-${shade}: ${value};`);
        }
        lines.push('');
      }

      // Typography
      const fonts = config.typography?.fonts as Record<string, string> | undefined;
      if (fonts) {
        lines.push(`  --font-primary: '${fonts.primary}', sans-serif;`);
        lines.push(`  --font-code: '${fonts.code}', monospace;`);
        lines.push('');
      }

      // Spacing
      if (config.spacing?.scales) {
        for (const [name, value] of Object.entries(config.spacing.scales)) {
          lines.push(`  --spacing-${name}: ${value}px;`);
        }
      }

      lines.push('}');

      return {
        contents: [{
          uri: 'brand://css-variables',
          mimeType: 'text/css',
          text: lines.join('\n'),
        }],
      };
    }
  );
}

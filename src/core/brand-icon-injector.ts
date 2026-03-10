import fs from 'node:fs/promises';
import path from 'node:path';

const ICONS_DIR = 'brand/data/icons';
const SVG_DIR = 'brand/svg';

/**
 * Semantic aliases for common icon requests
 */
const ICON_ALIASES: Record<string, string> = {
  'database': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'data-warehouse': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'warehouse': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'user': 'brand/svg/diagram-icons/icon-user-head.svg',
  'user-head': 'brand/svg/diagram-icons/icon-user-head.svg',
  'user-body': 'brand/svg/diagram-icons/icon-user-body.svg',
  'dashboard': 'brand/svg/diagram-icons/icon-dashboard.svg',
  'canvas': 'brand/svg/decorative/icon-canvas.svg',
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

interface IconAttributes {
  name: string;
  size?: string;
  width?: string;
  height?: string;
  color?: string;
  class?: string;
  style?: string;
}

/**
 * Resolve icon name to file path
 * Searches: aliases -> brand/data/icons -> brand/svg
 */
async function resolveIconPath(name: string): Promise<string | null> {
  // Check aliases first
  if (ICON_ALIASES[name]) {
    const aliasPath = path.resolve(ICON_ALIASES[name]);
    try {
      await fs.access(aliasPath);
      return aliasPath;
    } catch {
      // Alias path doesn't exist, continue searching
    }
  }

  // Search paths in order
  const searchPaths = [
    // Direct path in brand/data/icons/
    path.resolve(ICONS_DIR, `${name}.svg`),
    // Category/name in brand/data/icons/
    path.resolve(ICONS_DIR, name.includes('/') ? `${name}.svg` : `${name}.svg`),
    // Direct path in brand/svg/
    path.resolve(SVG_DIR, `${name}.svg`),
    // Category/name in brand/svg/
    path.resolve(SVG_DIR, name.includes('/') ? `${name}.svg` : `diagram-icons/${name}.svg`),
  ];

  for (const searchPath of searchPaths) {
    try {
      await fs.access(searchPath);
      return searchPath;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Parse attributes from a brand-icon tag
 */
function parseAttributes(tagContent: string): IconAttributes {
  const attrs: IconAttributes = { name: '' };

  // Match attribute="value" or attribute='value'
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let match;

  while ((match = attrRegex.exec(tagContent)) !== null) {
    const [, key, value] = match;
    if (key && value !== undefined) {
      // Type-safe attribute assignment
      if (key === 'name') attrs.name = value;
      else if (key === 'size') attrs.size = value;
      else if (key === 'width') attrs.width = value;
      else if (key === 'height') attrs.height = value;
      else if (key === 'color') attrs.color = value;
      else if (key === 'class') attrs.class = value;
      else if (key === 'style') attrs.style = value;
    }
  }

  return attrs;
}

/**
 * Modify SVG content with size and color attributes
 */
function applySvgAttributes(svgContent: string, attrs: IconAttributes): string {
  let svg = svgContent;

  // Determine dimensions
  const size = attrs.size;
  const width = attrs.width || size;
  const height = attrs.height || size;

  // Remove problematic attributes that cause distortion
  svg = svg.replace(/preserveAspectRatio="none"/g, '');
  svg = svg.replace(/width="100%"/g, '');
  svg = svg.replace(/height="100%"/g, '');

  // Add width/height if specified
  if (width || height) {
    // Replace or add width/height in opening svg tag
    svg = svg.replace(/<svg/, (match) => {
      let result = match;
      if (width) {
        result = `${result} width="${width}"`;
      }
      if (height) {
        result = `${result} height="${height}"`;
      }
      return result;
    });
  }

  // Apply color via CSS variable override
  if (attrs.color) {
    // Wrap in a span with CSS variable override
    svg = `<span style="--fill-0: ${attrs.color}; --stroke-0: ${attrs.color}; display: inline-flex;">${svg}</span>`;
  }

  // Add class if specified
  if (attrs.class) {
    svg = svg.replace(/<svg/, `<svg class="${attrs.class}"`);
  }

  // Add inline style if specified
  if (attrs.style) {
    svg = svg.replace(/<svg/, `<svg style="${attrs.style}"`);
  }

  return svg;
}

/**
 * Process HTML and replace all <brand-icon> elements with actual SVGs
 *
 * Usage in HTML:
 *   <brand-icon name="database" size="40" color="#52C396"/>
 *   <brand-icon name="chart/bar-chart" width="60" height="40"/>
 *   <brand-icon name="cursor" size="32"/>
 *
 * Returns processed HTML with SVGs injected
 */
export async function injectBrandIcons(html: string): Promise<{
  html: string;
  injectedIcons: string[];
  errors: string[];
}> {
  const injectedIcons: string[] = [];
  const errors: string[] = [];

  // Match <brand-icon ... /> or <brand-icon ...></brand-icon>
  const iconRegex = /<brand-icon\s+([^>]*?)\/?>(?:<\/brand-icon>)?/gi;

  // Collect all matches first (to avoid async issues with replace)
  const matches: { fullMatch: string; attrs: IconAttributes; index: number }[] = [];
  let match;

  while ((match = iconRegex.exec(html)) !== null) {
    const attrs = parseAttributes(match[1] || '');
    matches.push({
      fullMatch: match[0],
      attrs,
      index: match.index,
    });
  }

  // Process in reverse order to maintain correct indices
  let processedHtml = html;

  for (let i = matches.length - 1; i >= 0; i--) {
    const matchItem = matches[i];
    if (!matchItem) continue;
    const { fullMatch, attrs } = matchItem;

    if (!attrs.name) {
      errors.push(`brand-icon missing required "name" attribute: ${fullMatch}`);
      continue;
    }

    const iconPath = await resolveIconPath(attrs.name);

    if (!iconPath) {
      errors.push(`Icon not found: "${attrs.name}". Use list_icons to discover available icons.`);
      // Replace with error placeholder
      processedHtml = processedHtml.replace(
        fullMatch,
        `<!-- ERROR: Icon "${attrs.name}" not found -->`
      );
      continue;
    }

    try {
      const svgContent = await fs.readFile(iconPath, 'utf-8');
      const processedSvg = applySvgAttributes(svgContent.trim(), attrs);

      processedHtml = processedHtml.replace(fullMatch, processedSvg);
      injectedIcons.push(attrs.name);
    } catch (error) {
      errors.push(`Failed to read icon "${attrs.name}": ${(error as Error).message}`);
      processedHtml = processedHtml.replace(
        fullMatch,
        `<!-- ERROR: Failed to read icon "${attrs.name}" -->`
      );
    }
  }

  return {
    html: processedHtml,
    injectedIcons,
    errors,
  };
}

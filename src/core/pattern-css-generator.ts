/**
 * Generates CSS from pattern styles for auto-injection
 * Used by render_graphic when style_profile is specified
 */

import type { PatternEntry } from './extraction-types.js';

/**
 * Generate CSS variables and utility classes from a pattern
 */
export function generatePatternCSS(pattern: PatternEntry): string {
  const lines: string[] = [];

  // Brand rule: No italic fonts for body text
  lines.push('/* Brand: Avoid italic fonts */');
  lines.push('* { font-style: normal !important; }');
  lines.push('');

  lines.push(':root {');

  // Shadow CSS variables
  for (const [key, shadow] of Object.entries(pattern.styles.shadows)) {
    const varName = `--shadow-${kebabCase(key)}`;
    lines.push(`  ${varName}: ${shadow.css};`);
  }

  // Container border-radius variables
  for (const [key, container] of Object.entries(pattern.styles.containers)) {
    if (container.borderRadius) {
      lines.push(`  --radius-${kebabCase(key)}: ${container.borderRadius};`);
    }
  }

  lines.push('}');
  lines.push('');

  // Shadow utility classes
  for (const [key, shadow] of Object.entries(pattern.styles.shadows)) {
    const className = `shadow-${kebabCase(key)}`;
    lines.push(`.${className} { box-shadow: ${shadow.css}; }`);
  }
  lines.push('');

  // Container utility classes
  for (const [key, container] of Object.entries(pattern.styles.containers)) {
    const className = `container-${kebabCase(key)}`;
    const props: string[] = [];

    if (container.background) props.push(`background: ${container.background}`);
    if (container.border) props.push(`border: ${container.border}`);
    if (container.borderRadius) props.push(`border-radius: ${container.borderRadius}`);
    if (container.shadow) props.push(`box-shadow: ${container.shadow}`);
    if (container.backdropBlur) props.push(`backdrop-filter: blur(${container.backdropBlur})`);
    if (container.opacity !== undefined) props.push(`opacity: ${container.opacity}`);

    if (props.length > 0) {
      lines.push(`.${className} { ${props.join('; ')}; }`);
    }
  }
  lines.push('');

  // Typography utility classes
  for (const [key, typo] of Object.entries(pattern.styles.typography)) {
    const className = `text-${kebabCase(key)}`;
    const props: string[] = [];

    props.push(`font-family: ${typo.font}, sans-serif`);
    props.push(`font-weight: ${typo.weight}`);
    props.push(`font-size: ${typo.size}`);
    if (typo.lineHeight) props.push(`line-height: ${typo.lineHeight}`);
    if (typo.letterSpacing) props.push(`letter-spacing: ${typo.letterSpacing}`);
    if (typo.color) props.push(`color: ${typo.color}`);
    if (typo.textShadow) props.push(`text-shadow: ${typo.textShadow}`);

    lines.push(`.${className} { ${props.join('; ')}; }`);
  }

  return lines.join('\n');
}

/**
 * Inject CSS into HTML (before closing </head> or at start of <style>)
 */
export function injectCSS(html: string, css: string): string {
  const styleBlock = `<style data-pattern-css>\n${css}\n</style>`;

  // Try to inject before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${styleBlock}\n</head>`);
  }

  // Try to inject at start of existing <style>
  if (html.includes('<style>')) {
    return html.replace('<style>', `<style>\n${css}\n`);
  }

  // Fallback: prepend to HTML
  return `${styleBlock}\n${html}`;
}

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

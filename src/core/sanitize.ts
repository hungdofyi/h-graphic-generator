import path from 'node:path';
import type { Template } from './types.js';

/**
 * Maximum dimension for rendered graphics (prevents DoS)
 */
export const MAX_DIMENSION = 4096;

/**
 * Escape HTML special characters to prevent injection
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate output path is within allowed directory (prevents directory traversal)
 * @throws Error if path is outside allowed directory
 */
export function validateOutputPath(outputPath: string, allowedDir: string = process.cwd()): string {
  const resolved = path.resolve(outputPath);
  const resolvedAllowed = path.resolve(allowedDir);

  if (!resolved.startsWith(resolvedAllowed + path.sep) && resolved !== resolvedAllowed) {
    throw new Error(`Output path "${outputPath}" is outside allowed directory "${allowedDir}"`);
  }

  return resolved;
}

/**
 * Validate template props against schema
 * @throws Error if required props are missing
 */
export function validateProps(
  template: Template,
  props: Record<string, unknown>
): Record<string, unknown> {
  const validatedProps = { ...props };

  for (const [key, def] of Object.entries(template.props)) {
    const value = validatedProps[key];

    // Check required props
    if (def.required && (value === undefined || value === null)) {
      throw new Error(`Missing required prop "${key}" for template "${template.name}"`);
    }

    // Apply defaults for missing optional props
    if (value === undefined && def.default !== undefined) {
      validatedProps[key] = def.default;
    }
  }

  return validatedProps;
}

/**
 * Validate render dimensions are within safe limits
 * @throws Error if dimensions are invalid
 */
export function validateDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`Dimensions must be integers. Got ${width}x${height}`);
  }

  if (width < 1 || height < 1) {
    throw new Error(`Dimensions must be positive. Got ${width}x${height}`);
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(
      `Dimensions must be <= ${MAX_DIMENSION}px. Got ${width}x${height}`
    );
  }
}

/**
 * Sanitize SVG string to prevent XXE attacks
 */
export function sanitizeSvg(svg: string): string {
  // Remove DOCTYPE declarations that could enable XXE
  let sanitized = svg.replace(/<!DOCTYPE[^>]*>/gi, '');

  // Remove ENTITY declarations
  sanitized = sanitized.replace(/<!ENTITY[^>]*>/gi, '');

  // Remove external references
  sanitized = sanitized.replace(/<!ELEMENT[^>]*>/gi, '');

  // Remove script tags
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove foreignObject (can embed arbitrary HTML)
  sanitized = sanitized.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=/gi, ' data-removed=');

  return sanitized;
}

/**
 * Sanitize HTML for Puppeteer rendering
 * Removes potentially dangerous elements while preserving styling
 */
export function sanitizeHtmlForPuppeteer(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=/gi, ' data-removed=');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>/gi, '');

  // Remove object/embed tags
  sanitized = sanitized.replace(/<object[\s\S]*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');

  // Remove link tags that could load external resources
  sanitized = sanitized.replace(/<link[^>]*>/gi, '');

  // Remove meta refresh
  sanitized = sanitized.replace(/<meta[^>]*http-equiv[^>]*>/gi, '');

  return sanitized;
}

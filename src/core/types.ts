/**
 * Brand color definition with value and optional description
 */
export interface BrandColor {
  value: string;
  description?: string;
}

/**
 * Brand typography definition
 */
export interface BrandTypography {
  family: string;
  weight: string;
}

/**
 * Diagram-specific styling tokens
 */
export interface DiagramConfig {
  nodeColors: Record<string, string>;
  edgeColor: string;
  borderRadius: number;
}

/**
 * Full brand configuration matching brand.json schema
 */
export interface BrandConfig {
  $schema: string;
  name: string;
  colors: Record<string, BrandColor>;
  typography: Record<string, BrandTypography>;
  spacing: {
    unit: number;
    scales: Record<string, number>;
  };
  assets: Record<string, string>;
  diagram: DiagramConfig;
}

/**
 * Template prop type definitions
 */
export type PropType = 'string' | 'number' | 'boolean' | 'image' | 'array' | 'object';

/**
 * Template prop definition for schema
 */
export interface PropDefinition {
  type: PropType;
  required: boolean;
  default?: unknown;
  description: string;
}

/**
 * Template category classification
 */
export type TemplateCategory = 'marketing' | 'diagram' | 'social' | 'docs';

/**
 * Template contract - all templates must implement this interface
 */
export interface Template {
  name: string;
  description: string;
  category: TemplateCategory;
  defaultSize: { width: number; height: number };
  props: Record<string, PropDefinition>;
  render: (props: Record<string, unknown>, brand: BrandConfig) => string;
}

/**
 * Supported output formats
 */
export type OutputFormat = 'svg' | 'png' | 'jpg' | 'webp';

/**
 * Renderer type selection
 */
export type RendererType = 'auto' | 'satori' | 'puppeteer';

/**
 * Render options for engine
 */
export interface RenderOptions {
  html: string;
  width: number;
  height: number;
  format: OutputFormat;
  renderer?: RendererType;
  outputPath?: string;
}

/**
 * Render result from engine
 */
export interface RenderResult {
  buffer: Buffer;
  format: OutputFormat;
  width: number;
  height: number;
}

/**
 * Satori font weight type (must match Satori's expected values)
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Satori font configuration
 */
export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight?: FontWeight;
  style?: 'normal' | 'italic';
}

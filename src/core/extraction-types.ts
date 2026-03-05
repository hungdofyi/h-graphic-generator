/**
 * Types for Figma style extractions (v2 schema)
 * Flat style library format for AI graphic generation
 */

// v2 extraction file schema (h-graphic-styles-v2)
export interface StyleLibrary {
  $schema: 'h-graphic-styles-v2';
  page: string;
  extractedAt: string;
  backgrounds: Record<string, BackgroundStyle>;
  shadows?: Record<string, ShadowStyle>;
  containers: Record<string, ContainerStyle>;
  typography: Record<string, TypographyStyle>;
  graphicElements?: Record<string, GraphicElement>;
  chartElements?: Record<string, ChartElement>;
  layoutPatterns?: Record<string, LayoutPattern>;
  svgTemplates?: SvgTemplateConfig;
}

export interface BackgroundStyle {
  name: string;
  css: string;
  layers?: string[];
  blurElement?: {
    color: string;
    blur: string;
    rotation?: string;
  };
  decorativeElement?: Record<string, unknown>;
  border?: string;
  borderRadius?: string;
  usage: string[];
}

export interface ShadowStyle {
  name: string;
  css: string;
  usage: string[];
}

export interface ContainerStyle {
  name: string;
  background: string;
  border?: string;
  borderRadius?: string;
  shadow?: string;
  backdropBlur?: string;
  opacity?: number;
  innerBackground?: string;
  innerBorder?: string;
  innerBorderRadius?: string;
  headerBackground?: string;
  headerBorder?: string;
  headerBorderRadius?: string;
  layers?: Record<string, unknown>[];
  size?: { width: string; height: string };
  usage: string[];
}

export interface TypographyStyle {
  name?: string;
  font: string;
  weight: number | string;
  size: string;
  lineHeight?: string;
  letterSpacing?: string;
  color: string;
  opacity?: number;
  textShadow?: string;
  highlightColor?: string;
  usage: string[];
}

export interface GraphicElement {
  name?: string;
  description?: string;
  // Various element-specific properties
  size?: string;
  background?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  color?: string;
  blur?: string | { type: string; stdDeviation: string };
  rotation?: string;
  opacity?: number;
  blendMode?: string;
  gradient?: {
    type: string;
    stops: { offset: string; color: string; opacity?: number }[];
  };
  arrowhead?: { fill: string; type: string };
  svg?: string;
  svgs?: string[];
  containerBg?: string;
  textColor?: string;
  textSize?: string;
  textWeight?: number;
  types?: Record<string, unknown>;
  green?: { color: string; blendMode: string };
  gray?: { color: string; blendMode: string };
  usage: string[];
}

export interface ChartElement {
  colors?: string[];
  color?: string;
  segmentColors?: string[];
  barRadius?: string;
  barWidth?: string;
  borderRadius?: string;
  gridLineColor?: string;
  gridColor?: string;
  strokeColor?: string;
  type?: string;
  rotation?: string;
  opacity?: number;
  centerCircle?: boolean;
  usage: string[];
}

export interface LayoutPattern {
  name: string;
  structure: Record<string, string>;
  usage: string[];
}

export interface SvgTemplateConfig {
  location: string;
  files: Record<string, string>;
}

// Pattern entry for MCP tool responses
export interface PatternEntry {
  name: string;
  category: string;
  styles: {
    backgrounds: Record<string, BackgroundStyle>;
    shadows: Record<string, ShadowStyle>;
    containers: Record<string, ContainerStyle>;
    typography: Record<string, TypographyStyle>;
    graphicElements: Record<string, GraphicElement>;
    chartElements: Record<string, ChartElement>;
  };
  layoutPatterns: Record<string, LayoutPattern>;
  svgTemplates: SvgTemplateConfig | null;
}

// Lightweight summary for listing
export interface PatternSummary {
  name: string;
  category: string;
  stylesCount: {
    backgrounds: number;
    containers: number;
    typography: number;
    graphicElements: number;
    chartElements: number;
    layoutPatterns: number;
  };
}

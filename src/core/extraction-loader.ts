import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  StyleLibrary,
  PatternEntry,
  PatternSummary,
  BackgroundStyle,
  ShadowStyle,
  ContainerStyle,
  TypographyStyle,
  GraphicElement,
  ChartElement,
  LayoutPattern,
} from './extraction-types.js';

/**
 * Loads and indexes v2 style library extractions
 * Provides unified access to styles across all extraction files
 */
export class ExtractionLoader {
  private libraries: Map<string, StyleLibrary> = new Map();
  private categories: string[] = [];
  private extractedDir: string;

  private constructor(extractedDir: string) {
    this.extractedDir = extractedDir;
  }

  /**
   * Load all extraction files from brand/extracted/
   */
  static async load(extractedDir = 'brand/extracted'): Promise<ExtractionLoader> {
    const loader = new ExtractionLoader(path.resolve(extractedDir));
    await loader.loadFiles();
    return loader;
  }

  private async loadFiles(): Promise<void> {
    const entries = await fs.readdir(this.extractedDir, { withFileTypes: true });
    const jsonFiles = entries.filter(
      e => e.isFile() && e.name.endsWith('-styles.json')
    );

    for (const file of jsonFiles) {
      const filePath = path.join(this.extractedDir, file.name);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as StyleLibrary;

      // Only load v2 schema files
      if (data.$schema !== 'h-graphic-styles-v2') continue;

      const category = file.name.replace('-styles.json', '');
      this.libraries.set(category, data);
      this.categories.push(category);
    }
  }

  /**
   * List all available style libraries with counts
   */
  listPatterns(): PatternSummary[] {
    const summaries: PatternSummary[] = [];
    for (const [category, lib] of this.libraries) {
      summaries.push({
        name: lib.page,
        category,
        stylesCount: {
          backgrounds: Object.keys(lib.backgrounds || {}).length,
          containers: Object.keys(lib.containers || {}).length,
          typography: Object.keys(lib.typography || {}).length,
          graphicElements: Object.keys(lib.graphicElements || {}).length,
          chartElements: Object.keys(lib.chartElements || {}).length,
          layoutPatterns: Object.keys(lib.layoutPatterns || {}).length,
        },
      });
    }
    return summaries.sort((a, b) => a.category.localeCompare(b.category));
  }

  /**
   * List patterns by category
   */
  listPatternsByCategory(category: string): PatternSummary[] {
    return this.listPatterns().filter(p => p.category === category);
  }

  /**
   * Get full style library details
   */
  getPattern(category: string): PatternEntry | null {
    const lib = this.libraries.get(category);
    if (!lib) return null;

    return {
      name: lib.page,
      category,
      styles: {
        backgrounds: lib.backgrounds || {},
        shadows: lib.shadows || {},
        containers: lib.containers || {},
        typography: lib.typography || {},
        graphicElements: lib.graphicElements || {},
        chartElements: lib.chartElements || {},
      },
      layoutPatterns: lib.layoutPatterns || {},
      svgTemplates: lib.svgTemplates || null,
    };
  }

  /**
   * Get SVG template full path
   */
  getSvgPath(category: string, templateKey: string): string | null {
    const lib = this.libraries.get(category);
    if (!lib?.svgTemplates) return null;

    const fileName = lib.svgTemplates.files[templateKey];
    if (!fileName) return null;

    return path.join('brand/extracted', lib.svgTemplates.location, fileName);
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return [...this.categories].sort();
  }

  /**
   * Get raw style library by category
   */
  getStyleLibrary(category: string): StyleLibrary | null {
    return this.libraries.get(category) || null;
  }

  /**
   * Get all backgrounds across all libraries
   */
  getAllBackgrounds(): Record<string, BackgroundStyle & { source: string }> {
    const backgrounds: Record<string, BackgroundStyle & { source: string }> = {};
    for (const [category, lib] of this.libraries) {
      for (const [key, style] of Object.entries(lib.backgrounds || {})) {
        backgrounds[`${category}:${key}`] = { ...style, source: category };
      }
    }
    return backgrounds;
  }

  /**
   * Get all shadows across all libraries
   */
  getAllShadows(): Record<string, ShadowStyle & { source: string }> {
    const shadows: Record<string, ShadowStyle & { source: string }> = {};
    for (const [category, lib] of this.libraries) {
      for (const [key, style] of Object.entries(lib.shadows || {})) {
        shadows[`${category}:${key}`] = { ...style, source: category };
      }
    }
    return shadows;
  }

  /**
   * Get all containers across all libraries
   */
  getAllContainers(): Record<string, ContainerStyle & { source: string }> {
    const containers: Record<string, ContainerStyle & { source: string }> = {};
    for (const [category, lib] of this.libraries) {
      for (const [key, style] of Object.entries(lib.containers || {})) {
        containers[`${category}:${key}`] = { ...style, source: category };
      }
    }
    return containers;
  }

  /**
   * Get all typography across all libraries
   */
  getAllTypography(): Record<string, TypographyStyle & { source: string }> {
    const typography: Record<string, TypographyStyle & { source: string }> = {};
    for (const [category, lib] of this.libraries) {
      for (const [key, style] of Object.entries(lib.typography || {})) {
        typography[`${category}:${key}`] = { ...style, source: category };
      }
    }
    return typography;
  }

  /**
   * Get all graphic elements across all libraries
   */
  getAllGraphicElements(): Record<string, GraphicElement & { source: string }> {
    const elements: Record<string, GraphicElement & { source: string }> = {};
    for (const [category, lib] of this.libraries) {
      for (const [key, elem] of Object.entries(lib.graphicElements || {})) {
        elements[`${category}:${key}`] = { ...elem, source: category };
      }
    }
    return elements;
  }

  /**
   * Get all chart elements across all libraries
   */
  getAllChartElements(): Record<string, ChartElement & { source: string }> {
    const elements: Record<string, ChartElement & { source: string }> = {};
    for (const [category, lib] of this.libraries) {
      for (const [key, elem] of Object.entries(lib.chartElements || {})) {
        elements[`${category}:${key}`] = { ...elem, source: category };
      }
    }
    return elements;
  }

  /**
   * Get all layout patterns across all libraries
   */
  getAllLayoutPatterns(): Record<string, LayoutPattern & { source: string }> {
    const patterns: Record<string, LayoutPattern & { source: string }> = {};
    for (const [category, lib] of this.libraries) {
      for (const [key, pattern] of Object.entries(lib.layoutPatterns || {})) {
        patterns[`${category}:${key}`] = { ...pattern, source: category };
      }
    }
    return patterns;
  }
}

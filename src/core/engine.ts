import satori from 'satori';
import { html as satoriHtml } from 'satori-html';
import type { SatoriFont } from './types.js';
import type { BrandContext } from './brand-context.js';
import { loadFonts } from './font-loader.js';
import { validateDimensions } from './sanitize.js';

/**
 * Core rendering engine using Satori for HTML -> SVG conversion
 */
export class Engine {
  private brandContext: BrandContext;
  private fonts: SatoriFont[] = [];
  private initialized = false;

  constructor(brandContext: BrandContext) {
    this.brandContext = brandContext;
  }

  /**
   * Initialize engine - loads fonts
   * Must be called before rendering
   */
  async initialize(): Promise<void> {
    this.fonts = await loadFonts(this.brandContext.getConfig());
    this.initialized = true;
  }

  /**
   * Check if engine is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Render HTML string to SVG using Satori
   * @param htmlString HTML/CSS markup to render
   * @param size Output dimensions
   * @returns SVG string
   */
  async renderHtml(
    htmlString: string,
    size: { width: number; height: number }
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    validateDimensions(size.width, size.height);

    // Convert HTML string to Satori-compatible markup using satori-html
    const markup = satoriHtml(htmlString);

    // Render to SVG
    const svg = await satori(markup, {
      width: size.width,
      height: size.height,
      fonts: this.fonts,
    });

    return svg;
  }

  /**
   * Alias for renderHtml (backward compatibility)
   */
  async renderToSvg(
    htmlString: string,
    size: { width: number; height: number }
  ): Promise<string> {
    return this.renderHtml(htmlString, size);
  }

  /**
   * Cleanup resources (no-op for Satori, but needed for Puppeteer)
   */
  async cleanup(): Promise<void> {
    // Satori doesn't need cleanup, but method exists for interface consistency
  }

  /**
   * Check if HTML contains CSS that requires Puppeteer renderer
   * Returns true if complex CSS detected (gradients, shadows, grid, transforms)
   */
  static needsPuppeteer(htmlString: string): boolean {
    const complexCssPatterns = [
      /box-shadow:/i,
      /text-shadow:/i,
      /filter:/i,
      /backdrop-filter:/i,
      /transform:/i,
      /animation:/i,
      /transition:/i,
      /display:\s*grid/i,
      /grid-template/i,
      /linear-gradient/i,
      /radial-gradient/i,
      /conic-gradient/i,
    ];

    return complexCssPatterns.some((pattern) => pattern.test(htmlString));
  }
}

import puppeteer, { Browser } from 'puppeteer';
import type { BrandConfig } from './types.js';
import { validateDimensions, sanitizeHtmlForPuppeteer } from './sanitize.js';

/**
 * Puppeteer-based renderer for complex CSS that Satori doesn't support
 * Use for: gradients, shadows, grid, transforms, animations
 */
export class PuppeteerRenderer {
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser instance
   */
  async init(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  /**
   * Check if renderer is initialized
   */
  isInitialized(): boolean {
    return this.browser !== null;
  }

  /**
   * Render HTML to PNG buffer using Puppeteer
   */
  async renderToPng(
    htmlString: string,
    size: { width: number; height: number },
    _brandConfig?: BrandConfig
  ): Promise<Buffer> {
    if (!this.browser) {
      throw new Error('PuppeteerRenderer not initialized. Call init() first.');
    }

    validateDimensions(size.width, size.height);

    const page = await this.browser.newPage();

    try {
      // Set viewport to desired size
      await page.setViewport({
        width: size.width,
        height: size.height,
        deviceScaleFactor: 2, // 2x for retina
      });

      // Sanitize HTML to prevent XSS
      const sanitizedHtml = sanitizeHtmlForPuppeteer(htmlString);

      // Create full HTML document with the content
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { width: ${size.width}px; height: ${size.height}px; overflow: hidden; }
            </style>
          </head>
          <body>${sanitizedHtml}</body>
        </html>
      `;

      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: size.width, height: size.height },
      });

      return Buffer.from(screenshot);
    } finally {
      await page.close();
    }
  }

  /**
   * Render HTML to SVG string using Puppeteer
   * Note: This captures as PNG then embeds in SVG - not true vector
   */
  async renderToSvg(
    htmlString: string,
    size: { width: number; height: number },
    brandConfig?: BrandConfig
  ): Promise<string> {
    const pngBuffer = await this.renderToPng(htmlString, size, brandConfig);
    const base64 = pngBuffer.toString('base64');

    // Wrap PNG in SVG for compatibility with export pipeline
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}">
      <image href="data:image/png;base64,${base64}" width="${size.width}" height="${size.height}"/>
    </svg>`;
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

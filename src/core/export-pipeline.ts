import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import type { OutputFormat } from './types.js';
import { sanitizeSvg } from './sanitize.js';

/**
 * Export pipeline for converting SVG to various image formats
 */
export class ExportPipeline {
  /**
   * Export SVG string to specified format
   * @param svgString Input SVG markup
   * @param format Target format (svg, png, jpg, webp)
   * @param size Optional resize dimensions
   * @returns Buffer containing exported image
   */
  async export(
    svgString: string,
    format: OutputFormat,
    size?: { width: number; height: number }
  ): Promise<Buffer> {
    // Sanitize SVG to prevent XXE attacks
    const sanitized = sanitizeSvg(svgString);

    // Return SVG directly if requested
    if (format === 'svg') {
      return Buffer.from(sanitized, 'utf-8');
    }

    // Convert SVG to PNG using resvg
    const resvg = new Resvg(sanitized, {
      fitTo: size ? { mode: 'width', value: size.width } : undefined,
    });

    const pngData = resvg.render();
    const pngBuffer = Buffer.from(pngData.asPng());

    // Return PNG if requested
    if (format === 'png') {
      return pngBuffer;
    }

    // Convert PNG to JPG/WebP using Sharp
    const sharpInstance = sharp(pngBuffer);

    if (format === 'jpg') {
      return sharpInstance.jpeg({ quality: 90 }).toBuffer();
    }

    if (format === 'webp') {
      return sharpInstance.webp({ quality: 90 }).toBuffer();
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Get MIME type for output format
   */
  static getMimeType(format: OutputFormat): string {
    const mimeTypes: Record<OutputFormat, string> = {
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    };
    return mimeTypes[format];
  }

  /**
   * Get file extension for output format
   */
  static getExtension(format: OutputFormat): string {
    return format === 'jpg' ? 'jpg' : format;
  }
}

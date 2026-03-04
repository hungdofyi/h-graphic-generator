import { describe, it, expect } from 'vitest';
import { ExportPipeline } from '../src/core/export-pipeline.js';

describe('ExportPipeline', () => {
  const pipeline = new ExportPipeline();

  // Simple valid SVG for testing
  const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect x="10" y="10" width="80" height="80" fill="#0066CC"/>
  </svg>`;

  describe('export', () => {
    it('should export SVG format directly', async () => {
      const result = await pipeline.export(simpleSvg, 'svg');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('<svg');
    });

    it('should export PNG format', async () => {
      const result = await pipeline.export(simpleSvg, 'png');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      // PNG magic number: 89 50 4E 47
      expect(result[0]).toBe(0x89);
      expect(result[1]).toBe(0x50);
    });

    it('should export JPEG format', async () => {
      const result = await pipeline.export(simpleSvg, 'jpg');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      // JPEG magic number: FF D8 FF
      expect(result[0]).toBe(0xff);
      expect(result[1]).toBe(0xd8);
    });

    it('should export WebP format', async () => {
      const result = await pipeline.export(simpleSvg, 'webp');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      // WebP magic number: RIFF ... WEBP
      expect(result[0]).toBe(0x52); // R
      expect(result[1]).toBe(0x49); // I
      expect(result[8]).toBe(0x57); // W
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        pipeline.export(simpleSvg, 'gif' as any)
      ).rejects.toThrow('Unsupported format');
    });

    it('should handle SVG with size parameter for PNG', async () => {
      const result = await pipeline.export(simpleSvg, 'png', {
        width: 200,
        height: 200,
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should sanitize SVG before export', async () => {
      // SVG with XXE vulnerability attempt
      const maliciousSvg = `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE svg [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <text>&xxe;</text>
        </svg>`;

      // Should not throw, but sanitize the SVG
      const result = await pipeline.export(maliciousSvg, 'svg');
      expect(result).toBeDefined();
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for SVG', () => {
      const mimeType = ExportPipeline.getMimeType('svg');
      expect(mimeType).toBe('image/svg+xml');
    });

    it('should return correct MIME type for PNG', () => {
      const mimeType = ExportPipeline.getMimeType('png');
      expect(mimeType).toBe('image/png');
    });

    it('should return correct MIME type for JPEG', () => {
      const mimeType = ExportPipeline.getMimeType('jpg');
      expect(mimeType).toBe('image/jpeg');
    });

    it('should return correct MIME type for WebP', () => {
      const mimeType = ExportPipeline.getMimeType('webp');
      expect(mimeType).toBe('image/webp');
    });

    it('should return MIME types for all supported formats', () => {
      const formats = ['svg', 'png', 'jpg', 'webp'] as const;
      formats.forEach((format) => {
        const mimeType = ExportPipeline.getMimeType(format);
        expect(mimeType).toBeDefined();
        expect(typeof mimeType).toBe('string');
      });
    });
  });

  describe('getExtension', () => {
    it('should return correct extension for SVG', () => {
      const ext = ExportPipeline.getExtension('svg');
      expect(ext).toBe('svg');
    });

    it('should return correct extension for PNG', () => {
      const ext = ExportPipeline.getExtension('png');
      expect(ext).toBe('png');
    });

    it('should return correct extension for JPEG', () => {
      const ext = ExportPipeline.getExtension('jpg');
      expect(ext).toBe('jpg');
    });

    it('should return correct extension for WebP', () => {
      const ext = ExportPipeline.getExtension('webp');
      expect(ext).toBe('webp');
    });

    it('should return extensions for all supported formats', () => {
      const formats = ['svg', 'png', 'jpg', 'webp'] as const;
      formats.forEach((format) => {
        const ext = ExportPipeline.getExtension(format);
        expect(ext).toBeDefined();
        expect(typeof ext).toBe('string');
      });
    });
  });

  describe('format conversion pipeline', () => {
    it('should convert SVG to PNG to JPEG', async () => {
      const png = await pipeline.export(simpleSvg, 'png');
      expect(png).toBeInstanceOf(Buffer);

      // JPEG export validates PNG buffer format
      const jpeg = await pipeline.export(simpleSvg, 'jpg');
      expect(jpeg).toBeInstanceOf(Buffer);
    });

    it('should convert SVG to multiple formats consistently', async () => {
      const svg = await pipeline.export(simpleSvg, 'svg');
      const png = await pipeline.export(simpleSvg, 'png');
      const jpeg = await pipeline.export(simpleSvg, 'jpg');
      const webp = await pipeline.export(simpleSvg, 'webp');

      // All should produce valid buffers
      expect(svg).toBeInstanceOf(Buffer);
      expect(png).toBeInstanceOf(Buffer);
      expect(jpeg).toBeInstanceOf(Buffer);
      expect(webp).toBeInstanceOf(Buffer);

      // SVG should be smallest (just text)
      expect(svg.length).toBeLessThan(png.length);
    });
  });

  describe('edge cases', () => {
    it('should handle SVG with inline styles', async () => {
      const styledSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <style>
          .rect { fill: #0066CC; stroke: #FF6B35; }
        </style>
        <rect class="rect" x="10" y="10" width="80" height="80"/>
      </svg>`;

      const result = await pipeline.export(styledSvg, 'png');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle SVG with text elements', async () => {
      const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
        <text x="10" y="50" font-size="24">Hello World</text>
      </svg>`;

      const result = await pipeline.export(textSvg, 'png');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle SVG with namespaces', async () => {
      const nsSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100">
        <rect x="10" y="10" width="80" height="80" fill="#0066CC"/>
      </svg>`;

      const result = await pipeline.export(nsSvg, 'svg');
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});

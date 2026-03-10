import { describe, it, expect } from 'vitest';
import { BrandContext } from '../src/core/brand-context.js';
import { Engine } from '../src/core/engine.js';
import { ExportPipeline } from '../src/core/export-pipeline.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('CLI Commands - Smoke Tests', () => {
  describe('brand validate command', () => {
    it('should load and validate default brand config', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      expect(context).toBeDefined();
      expect(context.getConfig()).toBeDefined();
    });

    it('should validate required brand fields', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);
      const config = context.getConfig();

      expect(config.name).toBeDefined();
      expect(config.colors.primary.value).toBeDefined();
      expect(config.colors.text.value).toBeDefined();
      expect(context.resolveFont('body')).toBeDefined();
    });

    it('should report valid brand name', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      expect(context.getConfig().name).toBe('Holistics');
    });

    it('should resolve color tokens', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      expect(context.resolveColor('primary')).toBe('#05264C');
      expect(context.resolveColor('secondary')).toBe('#259B6C');
    });
  });

  describe('render command', () => {
    it('should render HTML to SVG', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);
      const engine = new Engine(context);

      await engine.initialize();

      const html = '<div style="font-size: 24px;">Hello World</div>';
      const svg = await engine.renderHtml(html, { width: 800, height: 600 });

      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');

      await engine.cleanup();
    });

    it('should export to multiple formats', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);
      const engine = new Engine(context);
      const pipeline = new ExportPipeline();

      await engine.initialize();

      const html = '<div style="font-size: 24px;">Hello</div>';
      const svg = await engine.renderHtml(html, { width: 800, height: 600 });

      // Test all supported formats
      const svgBuffer = await pipeline.export(svg, 'svg');
      const pngBuffer = await pipeline.export(svg, 'png');
      const jpgBuffer = await pipeline.export(svg, 'jpg');
      const webpBuffer = await pipeline.export(svg, 'webp');

      expect(svgBuffer).toBeInstanceOf(Buffer);
      expect(pngBuffer).toBeInstanceOf(Buffer);
      expect(jpgBuffer).toBeInstanceOf(Buffer);
      expect(webpBuffer).toBeInstanceOf(Buffer);

      await engine.cleanup();
    });
  });

  describe('command error handling', () => {
    it('should handle invalid brand config path', async () => {
      const invalidPath = '/nonexistent/path/to/brand.json';
      await expect(BrandContext.load(invalidPath)).rejects.toThrow();
    });

    it('should handle invalid HTML rendering', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);
      const engine = new Engine(context);

      await engine.initialize();

      // Invalid dimensions should throw
      await expect(
        engine.renderHtml('<div>Test</div>', { width: -100, height: 600 })
      ).rejects.toThrow();

      await engine.cleanup();
    });
  });

  describe('end-to-end workflow', () => {
    it('should complete full render workflow', async () => {
      // 1. Load brand
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      // 2. Create simple HTML
      const html = '<div style="font-size: 32px; color: #05264C;">E2E Test</div>';

      // 3. Initialize engine and render to SVG
      const engine = new Engine(context);
      await engine.initialize();
      const svg = await engine.renderHtml(html, {
        width: 800,
        height: 600,
      });

      // 4. Export to PNG
      const pipeline = new ExportPipeline();
      const pngBuffer = await pipeline.export(svg, 'png');

      expect(pngBuffer).toBeInstanceOf(Buffer);
      expect(pngBuffer.length).toBeGreaterThan(0);

      await engine.cleanup();
    });

    it('should handle E2E with custom branding', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      // Verify all brand components are accessible
      expect(context.resolveColor('primary')).toBeDefined();
      expect(context.resolveFont('body')).toBeDefined();
      expect(context.resolveSpacing('md')).toBeDefined();
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../src/core/engine.js';
import { BrandContext } from '../src/core/brand-context.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Engine', () => {
  let brandContext: BrandContext;
  let engine: Engine;

  beforeEach(async () => {
    const brandPath = path.join(__dirname, '../brand/brand.json');
    brandContext = await BrandContext.load(brandPath);
    engine = new Engine(brandContext);
  });

  afterEach(async () => {
    await engine.cleanup();
  });

  describe('initialization', () => {
    it('should create engine instance with brand context', () => {
      expect(engine).toBeDefined();
      expect(engine.isInitialized()).toBe(false);
    });

    it('should not be initialized before calling initialize()', () => {
      expect(engine.isInitialized()).toBe(false);
    });

    it('should be initialized after calling initialize()', async () => {
      await engine.initialize();
      expect(engine.isInitialized()).toBe(true);
    });

    it('should throw error when rendering without initialization', async () => {
      const html = '<div>Hello</div>';
      const size = { width: 800, height: 600 };

      await expect(engine.renderHtml(html, size)).rejects.toThrow(
        'Engine not initialized'
      );
    });
  });

  describe('renderHtml', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should render simple HTML to SVG', async () => {
      const html = '<div style="font-size: 24px;">Hello World</div>';
      const size = { width: 800, height: 600 };

      const svg = await engine.renderHtml(html, size);

      expect(svg).toBeDefined();
      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
    });

    it('should render HTML with styling', async () => {
      const html = `
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f0f0f0;
        ">
          <div style="font-size: 32px; color: #0066CC;">Test</div>
        </div>
      `;
      const size = { width: 1024, height: 768 };

      const svg = await engine.renderHtml(html, size);

      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
      expect(svg.length).toBeGreaterThan(100);
    });

    it('should handle empty HTML', async () => {
      const html = '';
      const size = { width: 800, height: 600 };

      const svg = await engine.renderHtml(html, size);
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });

    it('should validate dimensions - reject invalid width', async () => {
      const html = '<div>Test</div>';
      const size = { width: -100, height: 600 };

      await expect(engine.renderHtml(html, size)).rejects.toThrow();
    });

    it('should validate dimensions - reject invalid height', async () => {
      const html = '<div>Test</div>';
      const size = { width: 800, height: 0 };

      await expect(engine.renderHtml(html, size)).rejects.toThrow();
    });

    it('should validate dimensions - reject excessive width', async () => {
      const html = '<div>Test</div>';
      const size = { width: 100000, height: 600 };

      await expect(engine.renderHtml(html, size)).rejects.toThrow();
    });

    it('should render HTML with various fonts', async () => {
      const html = `
        <div style="font-family: Inter, sans-serif; font-size: 24px;">
          Styled Text
        </div>
      `;
      const size = { width: 800, height: 600 };

      const svg = await engine.renderHtml(html, size);
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });
  });

  describe('renderToSvg', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should be an alias for renderHtml', async () => {
      const html = '<div>Test</div>';
      const size = { width: 800, height: 600 };

      const svg1 = await engine.renderHtml(html, size);
      const svg2 = await engine.renderToSvg(html, size);

      // Both should return SVG strings
      expect(svg1).toContain('<svg');
      expect(svg2).toContain('<svg');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources without error', async () => {
      await engine.initialize();
      await expect(engine.cleanup()).resolves.toBeUndefined();
    });

    it('should be safe to call multiple times', async () => {
      await engine.initialize();
      await engine.cleanup();
      await expect(engine.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('needsPuppeteer', () => {
    it('should detect box-shadow requiring puppeteer', () => {
      const html = '<div style="box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(true);
    });

    it('should detect text-shadow requiring puppeteer', () => {
      const html = '<div style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(true);
    });

    it('should detect filter requiring puppeteer', () => {
      const html = '<div style="filter: blur(5px);">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(true);
    });

    it('should detect gradient requiring puppeteer', () => {
      const html = '<div style="background: linear-gradient(90deg, #0066CC, #FF6B35);">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(true);
    });

    it('should detect transform requiring puppeteer', () => {
      const html = '<div style="transform: rotate(45deg);">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(true);
    });

    it('should detect animation requiring puppeteer', () => {
      const html = '<div style="animation: spin 1s infinite;">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(true);
    });

    it('should detect grid requiring puppeteer', () => {
      const html = '<div style="display: grid; grid-template-columns: 1fr 1fr;">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(true);
    });

    it('should not require puppeteer for simple HTML', () => {
      const html = '<div style="color: #0066CC; font-size: 24px;">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(false);
    });

    it('should not require puppeteer for flexbox layout', () => {
      const html = '<div style="display: flex; justify-content: center;">Test</div>';
      expect(Engine.needsPuppeteer(html)).toBe(false);
    });
  });
});

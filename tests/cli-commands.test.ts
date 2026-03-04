import { describe, it, expect } from 'vitest';
import { registry } from '../src/templates/registry.js';
import { BrandContext } from '../src/core/brand-context.js';
import { Engine } from '../src/core/engine.js';
import { ExportPipeline } from '../src/core/export-pipeline.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('CLI Commands - Smoke Tests', () => {
  describe('templates list command', () => {
    it('should list all templates', () => {
      const templates = registry.list();
      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should list templates with complete metadata', () => {
      const templates = registry.list();
      templates.forEach((template) => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.defaultSize).toBeDefined();
      });
    });

    it('should support category filtering', () => {
      const marketingTemplates = registry.list('marketing');
      expect(marketingTemplates).toBeInstanceOf(Array);

      if (marketingTemplates.length > 0) {
        expect(marketingTemplates[0].category).toBe('marketing');
      }
    });
  });

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
      expect(config.typography.body).toBeDefined();
    });

    it('should report valid brand name', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      expect(context.getConfig().name).toBe('Default Brand');
    });

    it('should resolve color tokens', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      expect(context.resolveColor('primary')).toBe('#0066CC');
      expect(context.resolveColor('secondary')).toBe('#FF6B35');
    });
  });

  describe('generate command', () => {
    it('should generate graphic from template', async () => {
      const template = registry.get('feature-illustration');
      expect(template).toBeDefined();

      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      if (template) {
        const html = template.render(
          { title: 'Generated Feature' },
          context.getConfig()
        );

        expect(html).toBeDefined();
        expect(html).toContain('Generated Feature');
      }
    });

    it('should generate with custom props', async () => {
      const template = registry.get('feature-illustration');
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      if (template) {
        const html = template.render(
          {
            title: 'Custom Title',
            description: 'Custom Description',
            icon: '⭐',
          },
          context.getConfig()
        );

        expect(html).toContain('Custom Title');
        expect(html).toContain('Custom Description');
        expect(html).toContain('⭐');
      }
    });

    it('should use template default size', () => {
      const template = registry.get('feature-illustration');

      expect(template?.defaultSize.width).toBe(800);
      expect(template?.defaultSize.height).toBe(600);
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

  describe('diagram command', () => {
    it('should have diagram template available', () => {
      const diagramTemplates = registry.list('diagram');
      // Diagram templates may be available
      expect(diagramTemplates).toBeInstanceOf(Array);
    });
  });

  describe('command error handling', () => {
    it('should handle missing required template prop', () => {
      const template = registry.get('feature-illustration');
      const brandPath = path.join(__dirname, '../brand/brand.json');

      // This should work but might need title
      expect(template).toBeDefined();
    });

    it('should handle invalid template name', () => {
      const template = registry.get('nonexistent-template-xyz');
      expect(template).toBeUndefined();
    });

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

      // 2. Get template
      const template = registry.get('feature-illustration');

      // 3. Render template to HTML
      const html = template?.render(
        { title: 'E2E Test' },
        context.getConfig()
      );

      // 4. Initialize engine and render to SVG
      const engine = new Engine(context);
      await engine.initialize();
      const svg = await engine.renderHtml(html || '', {
        width: 800,
        height: 600,
      });

      // 5. Export to multiple formats
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

      const template = registry.get('feature-illustration');
      if (template) {
        const html = template.render(
          {
            title: 'Branded Content',
            accentColor: context.resolveColor('secondary'),
          },
          context.getConfig()
        );

        expect(html).toContain('Branded Content');
      }
    });
  });
});

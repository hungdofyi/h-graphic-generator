import { describe, it, expect, beforeEach } from 'vitest';
import { registry } from '../src/templates/registry.js';
import type { Template } from '../src/core/types.js';

describe('Template Registry', () => {
  describe('template discovery', () => {
    it('should have built-in templates registered', () => {
      expect(registry.size).toBeGreaterThan(0);
    });

    it('should have feature-illustration template', () => {
      expect(registry.has('feature-illustration')).toBe(true);
    });

    it('should have process-steps template', () => {
      expect(registry.has('process-steps')).toBe(true);
    });

    it('should have concept-comparison template', () => {
      expect(registry.has('concept-comparison')).toBe(true);
    });

    it('should have linear-flow template', () => {
      expect(registry.has('linear-flow')).toBe(true);
    });
  });

  describe('get template', () => {
    it('should retrieve feature-illustration template', () => {
      const template = registry.get('feature-illustration');
      expect(template).toBeDefined();
      expect(template?.name).toBe('feature-illustration');
    });

    it('should retrieve process-steps template', () => {
      const template = registry.get('process-steps');
      expect(template).toBeDefined();
      expect(template?.name).toBe('process-steps');
    });

    it('should return undefined for non-existent template', () => {
      const template = registry.get('nonexistent-template');
      expect(template).toBeUndefined();
    });
  });

  describe('list templates', () => {
    it('should list all templates', () => {
      const templates = registry.list();
      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should list templates by category', () => {
      const marketingTemplates = registry.list('marketing');
      expect(marketingTemplates).toBeInstanceOf(Array);
      expect(marketingTemplates.length).toBeGreaterThan(0);

      // All should be marketing category
      marketingTemplates.forEach((t) => {
        expect(t.category).toBe('marketing');
      });
    });

    it('should return empty array for non-existent category', () => {
      const templates = registry.list('nonexistent' as any);
      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBe(0);
    });

    it('should list diagram category templates', () => {
      const diagramTemplates = registry.list('diagram');
      expect(diagramTemplates).toBeInstanceOf(Array);
      // Diagram templates should exist
      if (diagramTemplates.length > 0) {
        diagramTemplates.forEach((t) => {
          expect(t.category).toBe('diagram');
        });
      }
    });
  });

  describe('template structure', () => {
    let template: Template | undefined;

    beforeEach(() => {
      template = registry.get('feature-illustration');
    });

    it('should have required template properties', () => {
      expect(template).toBeDefined();
      expect(template?.name).toBeDefined();
      expect(template?.description).toBeDefined();
      expect(template?.category).toBeDefined();
      expect(template?.defaultSize).toBeDefined();
      expect(template?.props).toBeDefined();
      expect(template?.render).toBeDefined();
    });

    it('should have valid default size', () => {
      expect(template?.defaultSize.width).toBeGreaterThan(0);
      expect(template?.defaultSize.height).toBeGreaterThan(0);
    });

    it('should have valid category', () => {
      const validCategories = ['marketing', 'diagram', 'social', 'docs'];
      expect(validCategories).toContain(template?.category);
    });

    it('should have description string', () => {
      expect(typeof template?.description).toBe('string');
      expect(template?.description.length).toBeGreaterThan(0);
    });

    it('should have render function', () => {
      expect(typeof template?.render).toBe('function');
    });
  });

  describe('template rendering', () => {
    it('should render feature-illustration template', () => {
      const template = registry.get('feature-illustration');
      const brandConfig = {
        $schema: 'h-graphic-brand-v1',
        name: 'Test Brand',
        colors: {
          primary: { value: '#0066CC' },
          secondary: { value: '#FF6B35' },
          background: { value: '#FFFFFF' },
          text: { value: '#1A1A2E' },
          muted: { value: '#6B7280' },
        },
        typography: {
          display: { family: 'Arial', weight: '700' },
          heading: { family: 'Arial', weight: '600' },
          body: { family: 'Arial', weight: '400' },
        },
        spacing: {
          unit: 8,
          scales: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
        },
        assets: {},
        diagram: {
          nodeColors: { default: '#E8F0FE', accent: '#FFF3E0' },
          edgeColor: '#6B7280',
          borderRadius: 8,
        },
      };

      const html = template?.render(
        { title: 'Test Feature' },
        brandConfig
      );

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('Test Feature');
      expect(html).toContain('style=');
    });

    it('should render template with all props', () => {
      const template = registry.get('feature-illustration');
      const brandConfig = {
        $schema: 'h-graphic-brand-v1',
        name: 'Test Brand',
        colors: {
          primary: { value: '#0066CC' },
          secondary: { value: '#FF6B35' },
          background: { value: '#FFFFFF' },
          text: { value: '#1A1A2E' },
          muted: { value: '#6B7280' },
        },
        typography: {
          display: { family: 'Arial', weight: '700' },
          heading: { family: 'Arial', weight: '600' },
          body: { family: 'Arial', weight: '400' },
        },
        spacing: {
          unit: 8,
          scales: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
        },
        assets: {},
        diagram: {
          nodeColors: { default: '#E8F0FE', accent: '#FFF3E0' },
          edgeColor: '#6B7280',
          borderRadius: 8,
        },
      };

      const html = template?.render(
        {
          title: 'Complete Feature',
          description: 'A feature with all props',
          icon: '🚀',
          accentColor: '#FF6B35',
        },
        brandConfig
      );

      expect(html).toBeDefined();
      expect(html).toContain('Complete Feature');
      expect(html).toContain('A feature with all props');
      expect(html).toContain('🚀');
    });

    it('should handle template with minimal props', () => {
      const template = registry.get('feature-illustration');
      const brandConfig = {
        $schema: 'h-graphic-brand-v1',
        name: 'Test Brand',
        colors: {
          primary: { value: '#0066CC' },
          secondary: { value: '#FF6B35' },
          background: { value: '#FFFFFF' },
          text: { value: '#1A1A2E' },
          muted: { value: '#6B7280' },
        },
        typography: {
          display: { family: 'Arial', weight: '700' },
          heading: { family: 'Arial', weight: '600' },
          body: { family: 'Arial', weight: '400' },
        },
        spacing: {
          unit: 8,
          scales: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
        },
        assets: {},
        diagram: {
          nodeColors: { default: '#E8F0FE', accent: '#FFF3E0' },
          edgeColor: '#6B7280',
          borderRadius: 8,
        },
      };

      // Only required props
      const html = template?.render({ title: 'Minimal' }, brandConfig);

      expect(html).toBeDefined();
      expect(html).toContain('Minimal');
    });
  });

  describe('template metadata', () => {
    it('all templates should have unique names', () => {
      const templates = registry.list();
      const names = templates.map((t) => t.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it('all templates should have default size', () => {
      const templates = registry.list();
      templates.forEach((template) => {
        expect(template.defaultSize.width).toBeGreaterThan(0);
        expect(template.defaultSize.height).toBeGreaterThan(0);
      });
    });

    it('all templates should have props definitions', () => {
      const templates = registry.list();
      templates.forEach((template) => {
        expect(template.props).toBeDefined();
        expect(typeof template.props).toBe('object');
      });
    });
  });
});

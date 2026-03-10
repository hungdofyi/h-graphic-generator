import { describe, it, expect } from 'vitest';
import { injectBrandIcons } from '../src/core/brand-icon-injector.js';

describe('brand-icon-injector', () => {
  describe('injectBrandIcons', () => {
    it('should inject SVG for known alias', async () => {
      const html = '<div><brand-icon name="database" size="40"/></div>';
      const result = await injectBrandIcons(html);

      expect(result.injectedIcons).toContain('database');
      expect(result.errors).toHaveLength(0);
      expect(result.html).toContain('<svg');
      expect(result.html).toContain('width="40"');
      expect(result.html).not.toContain('<brand-icon');
    });

    it('should inject multiple icons', async () => {
      const html = `
        <div>
          <brand-icon name="database" size="32"/>
          <brand-icon name="dashboard" size="48"/>
          <brand-icon name="cursor" size="24"/>
        </div>
      `;
      const result = await injectBrandIcons(html);

      expect(result.injectedIcons).toHaveLength(3);
      expect(result.injectedIcons).toContain('database');
      expect(result.injectedIcons).toContain('dashboard');
      expect(result.injectedIcons).toContain('cursor');
      expect(result.errors).toHaveLength(0);
    });

    it('should apply color via CSS variable wrapper', async () => {
      const html = '<brand-icon name="database" size="40" color="#52C396"/>';
      const result = await injectBrandIcons(html);

      expect(result.html).toContain('--fill-0: #52C396');
      expect(result.html).toContain('--stroke-0: #52C396');
    });

    it('should handle width and height separately', async () => {
      const html = '<brand-icon name="database" width="60" height="80"/>';
      const result = await injectBrandIcons(html);

      expect(result.html).toContain('width="60"');
      expect(result.html).toContain('height="80"');
    });

    it('should return error for unknown icon', async () => {
      const html = '<brand-icon name="nonexistent-icon-xyz"/>';
      const result = await injectBrandIcons(html);

      expect(result.injectedIcons).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('not found');
      expect(result.html).toContain('<!-- ERROR:');
    });

    it('should return error when name attribute is missing', async () => {
      const html = '<brand-icon size="40"/>';
      const result = await injectBrandIcons(html);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('missing required "name"');
    });

    it('should handle self-closing and regular tag formats', async () => {
      const html1 = '<brand-icon name="database" size="40"/>';
      const html2 = '<brand-icon name="database" size="40"></brand-icon>';

      const result1 = await injectBrandIcons(html1);
      const result2 = await injectBrandIcons(html2);

      expect(result1.injectedIcons).toContain('database');
      expect(result2.injectedIcons).toContain('database');
    });

    it('should remove preserveAspectRatio="none" from SVG', async () => {
      const html = '<brand-icon name="database" size="40"/>';
      const result = await injectBrandIcons(html);

      expect(result.html).not.toContain('preserveAspectRatio="none"');
    });

    it('should preserve HTML without brand-icon tags', async () => {
      const html = '<div><p>Hello world</p></div>';
      const result = await injectBrandIcons(html);

      expect(result.html).toBe(html);
      expect(result.injectedIcons).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should work with canvas alias', async () => {
      const html = '<brand-icon name="canvas" size="48"/>';
      const result = await injectBrandIcons(html);

      expect(result.injectedIcons).toContain('canvas');
      expect(result.errors).toHaveLength(0);
      expect(result.html).toContain('<svg');
    });
  });
});

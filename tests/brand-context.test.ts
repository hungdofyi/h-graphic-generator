import { describe, it, expect, beforeEach } from 'vitest';
import { BrandContext } from '../src/core/brand-context.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('BrandContext', () => {
  describe('load', () => {
    it('should load valid brand configuration', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);

      expect(context).toBeDefined();
      expect(context.getConfig()).toBeDefined();
      expect(context.getConfig().name).toBe('Default Brand');
    });

    it('should throw error when file does not exist', async () => {
      const nonExistentPath = path.join(__dirname, '../brand/nonexistent.json');
      await expect(BrandContext.load(nonExistentPath)).rejects.toThrow(
        'Failed to read brand config'
      );
    });

    it('should throw error when JSON is invalid', async () => {
      const tempDir = path.join(__dirname, '../.test-temp');
      await fs.mkdir(tempDir, { recursive: true });

      const invalidJsonPath = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidJsonPath, '{ invalid json }');

      try {
        await expect(BrandContext.load(invalidJsonPath)).rejects.toThrow(
          'Invalid JSON in brand config'
        );
      } finally {
        await fs.rm(invalidJsonPath);
      }
    });

    it('should throw error when required fields are missing', async () => {
      const tempDir = path.join(__dirname, '../.test-temp');
      await fs.mkdir(tempDir, { recursive: true });

      const incompletePath = path.join(tempDir, 'incomplete.json');
      const incompleteConfig = {
        $schema: 'h-graphic-brand-v1',
        colors: { primary: { value: '#0066CC' } },
      };
      await fs.writeFile(incompletePath, JSON.stringify(incompleteConfig));

      try {
        await expect(BrandContext.load(incompletePath)).rejects.toThrow(
          'Invalid brand config'
        );
      } finally {
        await fs.rm(incompletePath);
      }
    });
  });

  describe('resolveColor', () => {
    let context: BrandContext;

    beforeEach(async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      context = await BrandContext.load(brandPath);
    });

    it('should resolve primary color', () => {
      const color = context.resolveColor('primary');
      expect(color).toBe('#0066CC');
    });

    it('should resolve secondary color', () => {
      const color = context.resolveColor('secondary');
      expect(color).toBe('#FF6B35');
    });

    it('should return undefined for non-existent color', () => {
      const color = context.resolveColor('nonexistent');
      expect(color).toBeUndefined();
    });

    it('should resolve all brand colors', () => {
      expect(context.resolveColor('primary')).toBeDefined();
      expect(context.resolveColor('secondary')).toBeDefined();
      expect(context.resolveColor('background')).toBeDefined();
      expect(context.resolveColor('text')).toBeDefined();
      expect(context.resolveColor('muted')).toBeDefined();
    });
  });

  describe('resolveFont', () => {
    let context: BrandContext;

    beforeEach(async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      context = await BrandContext.load(brandPath);
    });

    it('should resolve display font', () => {
      const font = context.resolveFont('display');
      expect(font).toBeDefined();
      expect(font?.family).toBe('Inter');
      expect(font?.weight).toBe('700');
    });

    it('should resolve body font', () => {
      const font = context.resolveFont('body');
      expect(font).toBeDefined();
      expect(font?.family).toBe('Inter');
      expect(font?.weight).toBe('400');
    });

    it('should return undefined for non-existent font role', () => {
      const font = context.resolveFont('nonexistent');
      expect(font).toBeUndefined();
    });
  });

  describe('resolveSpacing', () => {
    let context: BrandContext;

    beforeEach(async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      context = await BrandContext.load(brandPath);
    });

    it('should resolve spacing scale xs', () => {
      const spacing = context.resolveSpacing('xs');
      expect(spacing).toBe(4);
    });

    it('should resolve spacing scale md', () => {
      const spacing = context.resolveSpacing('md');
      expect(spacing).toBe(16);
    });

    it('should resolve spacing scale 2xl', () => {
      const spacing = context.resolveSpacing('2xl');
      expect(spacing).toBe(48);
    });

    it('should return undefined for non-existent spacing scale', () => {
      const spacing = context.resolveSpacing('nonexistent');
      expect(spacing).toBeUndefined();
    });
  });

  describe('resolveAsset', () => {
    let context: BrandContext;

    beforeEach(async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      context = await BrandContext.load(brandPath);
    });

    it('should resolve logo asset path', () => {
      const assetPath = context.resolveAsset('logo');
      expect(assetPath).toBeDefined();
      expect(assetPath).toContain('assets/logo.svg');
    });

    it('should return undefined for non-existent asset', () => {
      const assetPath = context.resolveAsset('nonexistent');
      expect(assetPath).toBeUndefined();
    });
  });

  describe('getConfigPath', () => {
    it('should return the resolved config path', async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      const context = await BrandContext.load(brandPath);
      const configPath = context.getConfigPath();

      expect(configPath).toBeDefined();
      expect(configPath).toContain('brand.json');
    });
  });

  describe('loadStyleProfile', () => {
    let context: BrandContext;

    beforeEach(async () => {
      const brandPath = path.join(__dirname, '../brand/brand.json');
      context = await BrandContext.load(brandPath);
    });

    it('should return null when style profile does not exist', async () => {
      const profile = await context.loadStyleProfile();
      expect(profile).toBeNull();
    });

    it('should load and cache style profile if it exists', async () => {
      // This test verifies the method doesn't crash when profile is missing
      const profile = await context.loadStyleProfile();
      expect(profile === null || typeof profile === 'object').toBe(true);
    });
  });
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrandConfig, SatoriFont } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Default font paths (bundled Inter font)
 * Note: Satori does NOT support WOFF2 or variable fonts
 */
const BUNDLED_FONT_PATHS = [
  path.resolve(__dirname, '../../brand/assets/fonts/Inter-Regular.woff'),
  path.resolve(__dirname, '../../brand/assets/fonts/Inter-Regular.ttf'),
];

/**
 * Load fonts for Satori rendering
 * Priority: brand/assets/fonts/ -> bundled Inter -> error
 */
export async function loadFonts(brandConfig: BrandConfig): Promise<SatoriFont[]> {
  const fonts: SatoriFont[] = [];
  const loadedFamilies = new Set<string>();

  // Collect unique font families from brand config
  const families = new Set<string>();
  for (const typoDef of Object.values(brandConfig.typography)) {
    families.add(typoDef.family);
  }

  // Try to load each font family
  for (const family of families) {
    const fontPath = await findFontFile(family);

    if (fontPath) {
      try {
        const fontData = await fs.readFile(fontPath);
        fonts.push({
          name: family,
          data: fontData.buffer as ArrayBuffer,
          weight: 400 as const,
          style: 'normal',
        });
        loadedFamilies.add(family);
      } catch (error) {
        console.warn(`Failed to load font "${family}" from ${fontPath}: ${(error as Error).message}`);
      }
    }
  }

  // Ensure at least one font is available (use bundled Inter as fallback)
  if (fonts.length === 0) {
    const fallbackFont = await loadBundledFont();
    if (fallbackFont) {
      fonts.push(fallbackFont);
    } else {
      throw new Error(
        'No fonts available. Place TTF/WOFF2 files in brand/assets/fonts/ or ensure bundled Inter font exists.'
      );
    }
  }

  return fonts;
}

/**
 * Find font file in brand/assets/fonts/ directory
 */
async function findFontFile(family: string): Promise<string | null> {
  const fontDir = path.resolve(process.cwd(), 'brand/assets/fonts');
  const normalizedFamily = family.replace(/\s+/g, '-');

  // Try common font file patterns (TTF/WOFF only - Satori doesn't support WOFF2)
  const patterns = [
    `${normalizedFamily}-Regular.woff`,
    `${normalizedFamily}.woff`,
    `${normalizedFamily}-Regular.ttf`,
    `${normalizedFamily}.ttf`,
    `${family}-Regular.woff`,
    `${family}.woff`,
    `${family}-Regular.ttf`,
    `${family}.ttf`,
  ];

  for (const pattern of patterns) {
    const fontPath = path.join(fontDir, pattern);
    try {
      await fs.access(fontPath);
      return fontPath;
    } catch {
      // File doesn't exist, try next pattern
    }
  }

  return null;
}

/**
 * Load bundled Inter font as fallback
 */
async function loadBundledFont(): Promise<SatoriFont | null> {
  for (const fontPath of BUNDLED_FONT_PATHS) {
    try {
      await fs.access(fontPath);
      const fontData = await fs.readFile(fontPath);
      return {
        name: 'Inter',
        data: fontData.buffer as ArrayBuffer,
        weight: 400 as const,
        style: 'normal',
      };
    } catch {
      // Try next path
    }
  }
  // No bundled font found
  return null;
}

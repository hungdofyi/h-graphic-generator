import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrandConfig, SatoriFont, FontWeight } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Font directory paths */
const FONT_DIR = path.resolve(process.cwd(), 'brand/assets/fonts');
const STATIC_FONT_DIR = path.join(FONT_DIR, 'static');
const BUNDLED_STATIC_DIR = path.resolve(__dirname, '../../brand/assets/fonts/static');

/** Weight name to numeric value mapping */
const WEIGHT_MAP: Record<string, FontWeight> = {
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
};

/** Font families and their file prefixes */
const FONT_FAMILIES: Record<string, string> = {
  Inter: 'Inter',
  'Inter Display': 'InterDisplay',
  'JetBrains Mono': 'JetBrainsMono',
};

/**
 * Load fonts for Satori rendering with multiple weights
 * Priority: brand/assets/fonts/static/ -> bundled -> error
 */
export async function loadFonts(_brandConfig: BrandConfig): Promise<SatoriFont[]> {
  const fonts: SatoriFont[] = [];

  // Load all font families
  for (const family of Object.keys(FONT_FAMILIES)) {
    const familyFonts = await loadFontFamily(family);
    fonts.push(...familyFonts);
  }

  if (fonts.length === 0) {
    throw new Error(
      'No fonts available. Place TTF files in brand/assets/fonts/static/ directory.'
    );
  }

  return fonts;
}

/**
 * Load all weight variants for a font family
 */
async function loadFontFamily(family: string): Promise<SatoriFont[]> {
  const fonts: SatoriFont[] = [];
  const prefix = FONT_FAMILIES[family] || family.replace(/\s+/g, '');

  for (const [weightName, weightValue] of Object.entries(WEIGHT_MAP)) {
    const fontPath = await findFontFile(prefix, weightName);
    if (fontPath) {
      try {
        const fontData = await fs.readFile(fontPath);
        fonts.push({
          name: family,
          data: fontData.buffer as ArrayBuffer,
          weight: weightValue,
          style: 'normal',
        });
      } catch (error) {
        console.warn(`Failed to load ${prefix}-${weightName}: ${(error as Error).message}`);
      }
    }
  }

  return fonts;
}

/**
 * Find font file in static fonts directory
 */
async function findFontFile(prefix: string, weight: string): Promise<string | null> {
  const filename = `${prefix}-${weight}.ttf`;

  // Try project static fonts first
  const projectPath = path.join(STATIC_FONT_DIR, filename);
  try {
    await fs.access(projectPath);
    return projectPath;
  } catch {
    // Not found in project
  }

  // Try bundled static fonts
  const bundledPath = path.join(BUNDLED_STATIC_DIR, filename);
  try {
    await fs.access(bundledPath);
    return bundledPath;
  } catch {
    // Not found
  }

  return null;
}

/**
 * Get base64-encoded font data for CSS embedding (used by Puppeteer)
 */
export async function getFontDataForCss(): Promise<{ family: string; weight: number; base64: string }[]> {
  const fontData: { family: string; weight: number; base64: string }[] = [];

  for (const [family, prefix] of Object.entries(FONT_FAMILIES)) {
    for (const [weightName, weightValue] of Object.entries(WEIGHT_MAP)) {
      const fontPath = await findFontFile(prefix, weightName);
      if (fontPath) {
        try {
          const data = await fs.readFile(fontPath);
          fontData.push({
            family,
            weight: weightValue,
            base64: data.toString('base64'),
          });
        } catch {
          // Skip
        }
      }
    }
  }

  return fontData;
}

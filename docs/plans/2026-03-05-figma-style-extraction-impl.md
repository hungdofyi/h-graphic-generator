# Figma Style Extraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract brand styles from Figma source files using Figma MCP, generate modular building blocks for AI-powered graphic generation.

**Architecture:** Figma MCP extracts raw design data -> stored in brand/extracted/ -> Claude analyzes patterns -> outputs enriched brand.json + modular style building blocks in brand/styles/.

**Tech Stack:** TypeScript, Zod validation, Commander.js CLI, MCP SDK, Figma MCP (user-provided)

---

## Phase 1: Figma Data Types & Schema

### Task 1.1: Create Figma Type Definitions

**Files:**
- Create: `src/core/figma-types.ts`
- Test: `src/core/__tests__/figma-types.test.ts`

**Step 1: Write the failing test**

```typescript
// src/core/__tests__/figma-types.test.ts
import { describe, it, expect } from 'vitest';
import {
  FigmaColorSchema,
  FigmaGradientSchema,
  FigmaShadowSchema,
  FigmaNodeSchema,
} from '../figma-types.js';

describe('FigmaColorSchema', () => {
  it('validates solid color', () => {
    const color = { r: 0.1, g: 0.5, b: 0.3, a: 1 };
    expect(() => FigmaColorSchema.parse(color)).not.toThrow();
  });

  it('converts to hex', () => {
    const result = FigmaColorSchema.parse({ r: 1, g: 0, b: 0, a: 1 });
    expect(result).toMatchObject({ r: 1, g: 0, b: 0 });
  });
});

describe('FigmaGradientSchema', () => {
  it('validates linear gradient', () => {
    const gradient = {
      type: 'GRADIENT_LINEAR',
      gradientStops: [
        { position: 0, color: { r: 0.1, g: 0.6, b: 0.4, a: 1 } },
        { position: 1, color: { r: 0, g: 0.15, b: 0.3, a: 1 } },
      ],
      gradientHandlePositions: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    };
    expect(() => FigmaGradientSchema.parse(gradient)).not.toThrow();
  });
});

describe('FigmaShadowSchema', () => {
  it('validates drop shadow', () => {
    const shadow = {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 4 },
      radius: 12,
      spread: 0,
      visible: true,
    };
    expect(() => FigmaShadowSchema.parse(shadow)).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/core/__tests__/figma-types.test.ts`
Expected: FAIL with "Cannot find module '../figma-types.js'"

**Step 3: Write minimal implementation**

```typescript
// src/core/figma-types.ts
import { z } from 'zod';

/**
 * Figma RGBA color (0-1 range)
 */
export const FigmaColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1),
});

export type FigmaColor = z.infer<typeof FigmaColorSchema>;

/**
 * Convert Figma color to hex
 */
export function figmaColorToHex(color: FigmaColor): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Convert Figma color to rgba string
 */
export function figmaColorToRgba(color: FigmaColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r},${g},${b},${color.a})`;
}

/**
 * Gradient stop
 */
export const FigmaGradientStopSchema = z.object({
  position: z.number().min(0).max(1),
  color: FigmaColorSchema,
});

/**
 * Gradient handle position
 */
export const FigmaPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/**
 * Figma gradient fill
 */
export const FigmaGradientSchema = z.object({
  type: z.enum(['GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND']),
  gradientStops: z.array(FigmaGradientStopSchema),
  gradientHandlePositions: z.array(FigmaPositionSchema).optional(),
});

export type FigmaGradient = z.infer<typeof FigmaGradientSchema>;

/**
 * Figma shadow/blur effect
 */
export const FigmaShadowSchema = z.object({
  type: z.enum(['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR']),
  color: FigmaColorSchema.optional(),
  offset: FigmaPositionSchema.optional(),
  radius: z.number(),
  spread: z.number().optional(),
  visible: z.boolean().optional(),
});

export type FigmaShadow = z.infer<typeof FigmaShadowSchema>;

/**
 * Figma solid fill
 */
export const FigmaSolidFillSchema = z.object({
  type: z.literal('SOLID'),
  color: FigmaColorSchema,
  opacity: z.number().min(0).max(1).optional(),
});

/**
 * Any fill type
 */
export const FigmaFillSchema = z.union([
  FigmaSolidFillSchema,
  FigmaGradientSchema.extend({ type: z.enum(['GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND']) }),
]);

export type FigmaFill = z.infer<typeof FigmaFillSchema>;

/**
 * Figma stroke
 */
export const FigmaStrokeSchema = z.object({
  type: z.literal('SOLID'),
  color: FigmaColorSchema,
  opacity: z.number().min(0).max(1).optional(),
});

/**
 * Figma text style
 */
export const FigmaTextStyleSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.number(),
  fontWeight: z.number(),
  lineHeightPx: z.number().optional(),
  lineHeightPercent: z.number().optional(),
  letterSpacing: z.number().optional(),
  textCase: z.enum(['ORIGINAL', 'UPPER', 'LOWER', 'TITLE']).optional(),
});

export type FigmaTextStyle = z.infer<typeof FigmaTextStyleSchema>;

/**
 * Figma node (simplified)
 */
export const FigmaNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  fills: z.array(FigmaFillSchema).optional(),
  strokes: z.array(FigmaStrokeSchema).optional(),
  strokeWeight: z.number().optional(),
  effects: z.array(FigmaShadowSchema).optional(),
  cornerRadius: z.number().optional(),
  rectangleCornerRadii: z.array(z.number()).optional(),
  absoluteBoundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  style: FigmaTextStyleSchema.optional(),
  characters: z.string().optional(),
  opacity: z.number().optional(),
  blendMode: z.string().optional(),
  children: z.array(z.lazy(() => FigmaNodeSchema)).optional(),
});

export type FigmaNode = z.infer<typeof FigmaNodeSchema>;

/**
 * Figma page
 */
export const FigmaPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  children: z.array(FigmaNodeSchema),
});

export type FigmaPage = z.infer<typeof FigmaPageSchema>;

/**
 * Figma file (from MCP)
 */
export const FigmaFileSchema = z.object({
  name: z.string(),
  document: z.object({
    children: z.array(FigmaPageSchema),
  }),
  styles: z.record(z.string(), z.object({
    name: z.string(),
    styleType: z.enum(['FILL', 'TEXT', 'EFFECT', 'GRID']),
  })).optional(),
});

export type FigmaFile = z.infer<typeof FigmaFileSchema>;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/core/__tests__/figma-types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/figma-types.ts src/core/__tests__/figma-types.test.ts
git commit -m "feat(figma): add Figma data type definitions and schemas"
```

---

### Task 1.2: Create Extracted Style Types

**Files:**
- Create: `src/core/extracted-style-types.ts`
- Test: `src/core/__tests__/extracted-style-types.test.ts`

**Step 1: Write the failing test**

```typescript
// src/core/__tests__/extracted-style-types.test.ts
import { describe, it, expect } from 'vitest';
import {
  ExtractedGradientSchema,
  ExtractedShadowSchema,
  ExtractedLayoutSchema,
  ExtractedColorSchemeSchema,
} from '../extracted-style-types.js';

describe('ExtractedGradientSchema', () => {
  it('validates gradient definition', () => {
    const gradient = {
      name: 'primary-gradient',
      type: 'linear',
      angle: 135,
      stops: [
        { position: 0, color: '#259B6C' },
        { position: 1, color: '#05264C' },
      ],
    };
    expect(() => ExtractedGradientSchema.parse(gradient)).not.toThrow();
  });
});

describe('ExtractedShadowSchema', () => {
  it('validates shadow definition', () => {
    const shadow = {
      name: 'shadow-md',
      type: 'drop',
      offset: { x: 0, y: 4 },
      radius: 12,
      spread: 0,
      color: 'rgba(0,0,0,0.15)',
    };
    expect(() => ExtractedShadowSchema.parse(shadow)).not.toThrow();
  });
});

describe('ExtractedLayoutSchema', () => {
  it('validates layout definition', () => {
    const layout = {
      name: 'centered-hero',
      category: 'feature-illustrations',
      description: 'Centered focal point with decorative edges',
      dimensions: { width: 1200, height: 630 },
      composition: {
        focal: 'center',
        decorative: ['top-left', 'bottom-right'],
      },
    };
    expect(() => ExtractedLayoutSchema.parse(layout)).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/core/__tests__/extracted-style-types.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/core/extracted-style-types.ts
import { z } from 'zod';

/**
 * Extracted gradient (normalized from Figma)
 */
export const ExtractedGradientSchema = z.object({
  name: z.string(),
  type: z.enum(['linear', 'radial', 'angular', 'diamond']),
  angle: z.number().optional(),
  stops: z.array(z.object({
    position: z.number(),
    color: z.string(), // hex or rgba
  })),
});

export type ExtractedGradient = z.infer<typeof ExtractedGradientSchema>;

/**
 * Extracted shadow (normalized)
 */
export const ExtractedShadowSchema = z.object({
  name: z.string(),
  type: z.enum(['drop', 'inner', 'blur']),
  offset: z.object({ x: z.number(), y: z.number() }).optional(),
  radius: z.number(),
  spread: z.number().optional(),
  color: z.string(),
});

export type ExtractedShadow = z.infer<typeof ExtractedShadowSchema>;

/**
 * Extracted layout pattern
 */
export const ExtractedLayoutSchema = z.object({
  name: z.string(),
  category: z.string(),
  description: z.string(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  composition: z.record(z.string(), z.unknown()),
});

export type ExtractedLayout = z.infer<typeof ExtractedLayoutSchema>;

/**
 * Extracted color scheme
 */
export const ExtractedColorSchemeSchema = z.object({
  name: z.string(),
  description: z.string(),
  background: z.string(),
  primary: z.string(),
  accent: z.string(),
  text: z.string(),
  muted: z.string().optional(),
});

export type ExtractedColorScheme = z.infer<typeof ExtractedColorSchemeSchema>;

/**
 * Full extracted data from Figma
 */
export const ExtractedFigmaDataSchema = z.object({
  $schema: z.literal('h-graphic-extracted-v1'),
  extractedAt: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  globalStyles: z.object({
    colors: z.record(z.string(), z.string()),
    textStyles: z.record(z.string(), z.object({
      fontFamily: z.string(),
      fontSize: z.number(),
      fontWeight: z.number(),
      lineHeight: z.number().optional(),
    })),
    gradients: z.array(ExtractedGradientSchema),
    shadows: z.array(ExtractedShadowSchema),
  }),
  categories: z.record(z.string(), z.object({
    frames: z.array(z.object({
      name: z.string(),
      width: z.number(),
      height: z.number(),
      fills: z.array(z.string()),
      effects: z.array(z.string()),
      children: z.array(z.unknown()),
    })),
  })),
});

export type ExtractedFigmaData = z.infer<typeof ExtractedFigmaDataSchema>;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/core/__tests__/extracted-style-types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/extracted-style-types.ts src/core/__tests__/extracted-style-types.test.ts
git commit -m "feat(figma): add extracted style type definitions"
```

---

## Phase 2: Figma Extractor Core

### Task 2.1: Create Figma Extractor Class

**Files:**
- Create: `src/core/figma-extractor.ts`
- Test: `src/core/__tests__/figma-extractor.test.ts`

**Step 1: Write the failing test**

```typescript
// src/core/__tests__/figma-extractor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FigmaExtractor } from '../figma-extractor.js';

describe('FigmaExtractor', () => {
  describe('extractColors', () => {
    it('extracts solid fills as hex colors', () => {
      const extractor = new FigmaExtractor();
      const fills = [
        { type: 'SOLID' as const, color: { r: 0.1, g: 0.6, b: 0.4, a: 1 } },
      ];
      const colors = extractor.extractColors(fills);
      expect(colors).toContain('#199966');
    });
  });

  describe('extractGradients', () => {
    it('extracts linear gradients', () => {
      const extractor = new FigmaExtractor();
      const fills = [
        {
          type: 'GRADIENT_LINEAR' as const,
          gradientStops: [
            { position: 0, color: { r: 0.15, g: 0.61, b: 0.42, a: 1 } },
            { position: 1, color: { r: 0.02, g: 0.15, b: 0.3, a: 1 } },
          ],
          gradientHandlePositions: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        },
      ];
      const gradients = extractor.extractGradients(fills);
      expect(gradients).toHaveLength(1);
      expect(gradients[0].type).toBe('linear');
      expect(gradients[0].stops).toHaveLength(2);
    });
  });

  describe('extractShadows', () => {
    it('extracts drop shadows', () => {
      const extractor = new FigmaExtractor();
      const effects = [
        {
          type: 'DROP_SHADOW' as const,
          color: { r: 0, g: 0, b: 0, a: 0.15 },
          offset: { x: 0, y: 4 },
          radius: 12,
          spread: 0,
          visible: true,
        },
      ];
      const shadows = extractor.extractShadows(effects);
      expect(shadows).toHaveLength(1);
      expect(shadows[0].type).toBe('drop');
      expect(shadows[0].radius).toBe(12);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/core/__tests__/figma-extractor.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/core/figma-extractor.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type FigmaFill,
  type FigmaShadow,
  type FigmaNode,
  type FigmaPage,
  figmaColorToHex,
  figmaColorToRgba,
} from './figma-types.js';
import {
  type ExtractedGradient,
  type ExtractedShadow,
  type ExtractedFigmaData,
} from './extracted-style-types.js';

export interface FigmaExtractorOptions {
  outputDir: string;
  onProgress?: (message: string) => void;
}

/**
 * Extracts and normalizes design data from Figma MCP output
 */
export class FigmaExtractor {
  /**
   * Extract hex colors from fills
   */
  extractColors(fills: FigmaFill[]): string[] {
    const colors: string[] = [];
    for (const fill of fills) {
      if (fill.type === 'SOLID') {
        colors.push(figmaColorToHex(fill.color));
      }
    }
    return colors;
  }

  /**
   * Extract gradients from fills
   */
  extractGradients(fills: FigmaFill[]): ExtractedGradient[] {
    const gradients: ExtractedGradient[] = [];
    let index = 0;

    for (const fill of fills) {
      if (fill.type.startsWith('GRADIENT_')) {
        const gradientFill = fill as {
          type: string;
          gradientStops: Array<{ position: number; color: { r: number; g: number; b: number; a: number } }>;
          gradientHandlePositions?: Array<{ x: number; y: number }>;
        };

        const typeMap: Record<string, 'linear' | 'radial' | 'angular' | 'diamond'> = {
          GRADIENT_LINEAR: 'linear',
          GRADIENT_RADIAL: 'radial',
          GRADIENT_ANGULAR: 'angular',
          GRADIENT_DIAMOND: 'diamond',
        };

        // Calculate angle from handle positions (simplified)
        let angle = 0;
        if (gradientFill.gradientHandlePositions && gradientFill.gradientHandlePositions.length >= 2) {
          const [start, end] = gradientFill.gradientHandlePositions;
          angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI));
        }

        gradients.push({
          name: `gradient-${index++}`,
          type: typeMap[fill.type] || 'linear',
          angle,
          stops: gradientFill.gradientStops.map((stop) => ({
            position: stop.position,
            color: figmaColorToHex(stop.color),
          })),
        });
      }
    }

    return gradients;
  }

  /**
   * Extract shadows from effects
   */
  extractShadows(effects: FigmaShadow[]): ExtractedShadow[] {
    const shadows: ExtractedShadow[] = [];
    let index = 0;

    for (const effect of effects) {
      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        if (effect.visible === false) continue;

        const typeMap: Record<string, 'drop' | 'inner' | 'blur'> = {
          DROP_SHADOW: 'drop',
          INNER_SHADOW: 'inner',
          LAYER_BLUR: 'blur',
        };

        shadows.push({
          name: `shadow-${index++}`,
          type: typeMap[effect.type] || 'drop',
          offset: effect.offset,
          radius: effect.radius,
          spread: effect.spread,
          color: effect.color ? figmaColorToRgba(effect.color) : 'rgba(0,0,0,0.1)',
        });
      }
    }

    return shadows;
  }

  /**
   * Process a Figma page to extract category data
   */
  processPage(page: FigmaPage): {
    name: string;
    frames: Array<{
      name: string;
      width: number;
      height: number;
      fills: string[];
      effects: string[];
      children: unknown[];
    }>;
  } {
    const frames: Array<{
      name: string;
      width: number;
      height: number;
      fills: string[];
      effects: string[];
      children: unknown[];
    }> = [];

    for (const child of page.children) {
      if (child.type === 'FRAME' || child.type === 'COMPONENT') {
        const box = child.absoluteBoundingBox;
        frames.push({
          name: child.name,
          width: box?.width || 0,
          height: box?.height || 0,
          fills: child.fills ? this.extractColors(child.fills) : [],
          effects: child.effects
            ? this.extractShadows(child.effects).map((s) => s.name)
            : [],
          children: child.children || [],
        });
      }
    }

    return { name: page.name, frames };
  }

  /**
   * Save extracted data to disk
   */
  async saveExtractedData(
    data: ExtractedFigmaData,
    outputDir: string
  ): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    // Save global styles
    const globalPath = path.join(outputDir, 'global-styles.json');
    await fs.writeFile(
      globalPath,
      JSON.stringify(data.globalStyles, null, 2),
      'utf-8'
    );

    // Save per-category data
    const categoriesDir = path.join(outputDir, 'categories');
    await fs.mkdir(categoriesDir, { recursive: true });

    for (const [category, categoryData] of Object.entries(data.categories)) {
      const categoryPath = path.join(
        categoriesDir,
        `${category.toLowerCase().replace(/\s+/g, '-')}.json`
      );
      await fs.writeFile(
        categoryPath,
        JSON.stringify(categoryData, null, 2),
        'utf-8'
      );
    }

    // Save full extraction
    const fullPath = path.join(outputDir, 'extracted-data.json');
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/core/__tests__/figma-extractor.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/figma-extractor.ts src/core/__tests__/figma-extractor.test.ts
git commit -m "feat(figma): add FigmaExtractor class for data extraction"
```

---

## Phase 3: CLI Commands

### Task 3.1: Create Figma CLI Command

**Files:**
- Create: `src/cli/commands/figma.ts`
- Modify: `src/cli/index.ts:1-27`

**Step 1: Write the command implementation**

```typescript
// src/cli/commands/figma.ts
import type { Command } from 'commander';
import pc from 'picocolors';
import fs from 'node:fs/promises';
import path from 'node:path';

export function registerFigmaCommand(program: Command): void {
  const figma = program
    .command('figma')
    .description('Figma style extraction commands');

  figma
    .command('extract')
    .description('Extract styles from Figma MCP data file')
    .requiredOption('--input <path>', 'Path to Figma MCP JSON output')
    .option('--output <dir>', 'Output directory', 'brand/extracted')
    .action(async (options) => {
      try {
        console.log(pc.bold('\n📐 Extracting styles from Figma data...\n'));

        // Check input file exists
        const inputPath = path.resolve(options.input);
        const inputExists = await fs.access(inputPath).then(() => true).catch(() => false);

        if (!inputExists) {
          throw new Error(`Input file not found: ${inputPath}`);
        }

        // Read and parse Figma data
        const rawData = await fs.readFile(inputPath, 'utf-8');
        const figmaData = JSON.parse(rawData);

        console.log(`  File: ${figmaData.name || 'Unknown'}`);
        console.log(`  Pages: ${figmaData.document?.children?.length || 0}`);

        // Import extractor dynamically to avoid circular deps
        const { FigmaExtractor } = await import('../../core/figma-extractor.js');
        const extractor = new FigmaExtractor();

        // Process pages
        const categories: Record<string, unknown> = {};
        const allGradients: unknown[] = [];
        const allShadows: unknown[] = [];
        const allColors: Set<string> = new Set();

        for (const page of figmaData.document?.children || []) {
          console.log(`\n  Processing: ${page.name}`);
          const processed = extractor.processPage(page);
          categories[page.name] = processed;

          // Collect global styles from frames
          for (const frame of processed.frames) {
            frame.fills.forEach((c: string) => allColors.add(c));
          }
        }

        // Build extracted data structure
        const extractedData = {
          $schema: 'h-graphic-extracted-v1' as const,
          extractedAt: new Date().toISOString(),
          fileKey: options.input,
          fileName: figmaData.name || 'unknown',
          globalStyles: {
            colors: Object.fromEntries([...allColors].map((c, i) => [`color-${i}`, c])),
            textStyles: {},
            gradients: allGradients,
            shadows: allShadows,
          },
          categories,
        };

        // Save
        await extractor.saveExtractedData(extractedData, options.output);

        console.log(pc.green('\n✓ Extraction complete!'));
        console.log(`  Output: ${options.output}/`);
      } catch (error) {
        console.error(pc.red('\n✗ Extraction failed'));
        console.error(`  ${(error as Error).message}`);
        process.exit(1);
      }
    });

  figma
    .command('analyze')
    .description('Analyze extracted data and generate style building blocks')
    .option('--input <dir>', 'Extracted data directory', 'brand/extracted')
    .option('--output <dir>', 'Output directory for building blocks', 'brand/styles')
    .action(async (options) => {
      try {
        console.log(pc.bold('\n🔍 Analyzing extracted styles...\n'));

        // Check input exists
        const inputDir = path.resolve(options.input);
        const extractedPath = path.join(inputDir, 'extracted-data.json');

        const exists = await fs.access(extractedPath).then(() => true).catch(() => false);
        if (!exists) {
          throw new Error(
            `No extracted data found at ${extractedPath}\n` +
            `Run 'hgraphic figma extract' first.`
          );
        }

        console.log(`  Input: ${inputDir}`);
        console.log(`  Output: ${options.output}`);

        // Read extracted data
        const rawData = await fs.readFile(extractedPath, 'utf-8');
        const extracted = JSON.parse(rawData);

        // Create output directories
        const outputDir = path.resolve(options.output);
        await fs.mkdir(path.join(outputDir, 'layouts'), { recursive: true });
        await fs.mkdir(path.join(outputDir, 'color-schemes'), { recursive: true });
        await fs.mkdir(path.join(outputDir, 'effects'), { recursive: true });
        await fs.mkdir(path.join(outputDir, 'compositions'), { recursive: true });

        // Save gradients
        if (extracted.globalStyles?.gradients?.length > 0) {
          await fs.writeFile(
            path.join(outputDir, 'effects', 'gradients.json'),
            JSON.stringify(extracted.globalStyles.gradients, null, 2),
            'utf-8'
          );
          console.log(`  ✓ Saved ${extracted.globalStyles.gradients.length} gradients`);
        }

        // Save shadows
        if (extracted.globalStyles?.shadows?.length > 0) {
          await fs.writeFile(
            path.join(outputDir, 'effects', 'shadows.json'),
            JSON.stringify(extracted.globalStyles.shadows, null, 2),
            'utf-8'
          );
          console.log(`  ✓ Saved ${extracted.globalStyles.shadows.length} shadows`);
        }

        // Save per-category layouts (placeholder for AI analysis)
        for (const [categoryName, categoryData] of Object.entries(extracted.categories || {})) {
          const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
          const layoutDir = path.join(outputDir, 'layouts', slug);
          await fs.mkdir(layoutDir, { recursive: true });

          // Save raw category data for later analysis
          await fs.writeFile(
            path.join(layoutDir, '_raw.json'),
            JSON.stringify(categoryData, null, 2),
            'utf-8'
          );
          console.log(`  ✓ Category: ${categoryName}`);
        }

        console.log(pc.green('\n✓ Analysis complete!'));
        console.log(pc.dim('  Note: Run pattern analysis to generate layout templates.'));
      } catch (error) {
        console.error(pc.red('\n✗ Analysis failed'));
        console.error(`  ${(error as Error).message}`);
        process.exit(1);
      }
    });

  figma
    .command('sync')
    .description('Extract and analyze in one step')
    .requiredOption('--input <path>', 'Path to Figma MCP JSON output')
    .option('--extracted <dir>', 'Extracted data directory', 'brand/extracted')
    .option('--styles <dir>', 'Output directory for building blocks', 'brand/styles')
    .action(async (options) => {
      console.log(pc.bold('\n🔄 Syncing Figma styles...\n'));

      // Run extract
      await program.parseAsync(['node', 'hgraphic', 'figma', 'extract', '--input', options.input, '--output', options.extracted]);

      // Run analyze
      await program.parseAsync(['node', 'hgraphic', 'figma', 'analyze', '--input', options.extracted, '--output', options.styles]);

      console.log(pc.green('\n✓ Sync complete!'));
    });
}
```

**Step 2: Update CLI index to register command**

```typescript
// src/cli/index.ts (updated)
import { Command } from 'commander';
import { registerRenderCommand } from './commands/render.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerDiagramCommand } from './commands/diagram.js';
import { registerBrandCommand } from './commands/brand.js';
import { registerTemplatesCommand } from './commands/templates.js';
import { registerFigmaCommand } from './commands/figma.js';

const program = new Command();

program
  .name('hgraphic')
  .description('Branded graphic and diagram generator')
  .version('0.1.0');

// Primary command - render HTML/CSS to image
registerRenderCommand(program);

// Template-based generation
registerGenerateCommand(program);
registerDiagramCommand(program);

// Brand management
registerBrandCommand(program);
registerTemplatesCommand(program);

// Figma extraction
registerFigmaCommand(program);

program.parse();
```

**Step 3: Build and verify**

Run: `npm run build && ./dist/cli/index.js figma --help`
Expected: Shows figma command help with extract, analyze, sync subcommands

**Step 4: Commit**

```bash
git add src/cli/commands/figma.ts src/cli/index.ts
git commit -m "feat(cli): add figma extract/analyze/sync commands"
```

---

## Phase 4: MCP Tools

### Task 4.1: Add list_layouts MCP Tool

**Files:**
- Create: `src/mcp/tools/list-layouts.ts`
- Modify: `src/mcp/tools/index.ts`

**Step 1: Write implementation**

```typescript
// src/mcp/tools/list-layouts.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

const ListLayoutsSchema = z.object({
  category: z.string().optional().describe('Filter by category (e.g., "feature-illustrations")'),
});

export function registerListLayoutsTool(server: McpServer): void {
  server.tool(
    'list_layouts',
    'List available layout templates for graphic generation. Optionally filter by category.',
    ListLayoutsSchema.shape,
    async (params) => {
      try {
        const layoutsDir = path.resolve('brand/styles/layouts');

        // Check if layouts directory exists
        const exists = await fs.access(layoutsDir).then(() => true).catch(() => false);
        if (!exists) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: 'No layouts found. Run `hgraphic figma sync` to extract from Figma.',
              }),
            }],
            isError: true,
          };
        }

        // Read categories
        const categories = await fs.readdir(layoutsDir, { withFileTypes: true });
        const result: Record<string, string[]> = {};

        for (const cat of categories) {
          if (!cat.isDirectory()) continue;
          if (params.category && cat.name !== params.category) continue;

          const catPath = path.join(layoutsDir, cat.name);
          const files = await fs.readdir(catPath);
          const layouts = files
            .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
            .map((f) => f.replace('.json', ''));

          if (layouts.length > 0) {
            result[cat.name] = layouts;
          }
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              layouts: result,
              usage: 'Use layout names with render_graphic to apply consistent composition.',
            }),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: (error as Error).message,
            }),
          }],
          isError: true,
        };
      }
    }
  );
}
```

**Step 2: Update tools index**

Add to `src/mcp/tools/index.ts`:

```typescript
import { registerListLayoutsTool } from './list-layouts.js';

// In registerTools function, add:
registerListLayoutsTool(server);
```

**Step 3: Commit**

```bash
git add src/mcp/tools/list-layouts.ts src/mcp/tools/index.ts
git commit -m "feat(mcp): add list_layouts tool"
```

---

### Task 4.2: Add list_color_schemes MCP Tool

**Files:**
- Create: `src/mcp/tools/list-color-schemes.ts`
- Modify: `src/mcp/tools/index.ts`

**Step 1: Write implementation**

```typescript
// src/mcp/tools/list-color-schemes.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

const ListColorSchemesSchema = z.object({});

export function registerListColorSchemesTool(server: McpServer): void {
  server.tool(
    'list_color_schemes',
    'List available color schemes for graphic generation.',
    ListColorSchemesSchema.shape,
    async () => {
      try {
        const schemesDir = path.resolve('brand/styles/color-schemes');

        const exists = await fs.access(schemesDir).then(() => true).catch(() => false);
        if (!exists) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: 'No color schemes found. Run `hgraphic figma sync` to extract from Figma.',
              }),
            }],
            isError: true,
          };
        }

        const files = await fs.readdir(schemesDir);
        const schemes: Record<string, unknown>[] = [];

        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          const content = await fs.readFile(path.join(schemesDir, file), 'utf-8');
          schemes.push(JSON.parse(content));
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              colorSchemes: schemes,
              usage: 'Apply a color scheme to your HTML/CSS for consistent branding.',
            }),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: (error as Error).message,
            }),
          }],
          isError: true,
        };
      }
    }
  );
}
```

**Step 2: Update tools index**

```typescript
import { registerListColorSchemesTool } from './list-color-schemes.js';

// In registerTools function:
registerListColorSchemesTool(server);
```

**Step 3: Commit**

```bash
git add src/mcp/tools/list-color-schemes.ts src/mcp/tools/index.ts
git commit -m "feat(mcp): add list_color_schemes tool"
```

---

## Phase 5: Reference-to-Brand Generation

### Task 5.1: Add Reference Flag to Generate Command

**Files:**
- Modify: `src/cli/commands/generate.ts`

**Step 1: Read current implementation**

Run: Read `src/cli/commands/generate.ts` to understand current structure

**Step 2: Add --reference option**

Add to generate command options:
```typescript
.option('--reference <path>', 'External reference image to analyze and recreate on-brand')
```

Add handler logic:
```typescript
if (options.reference) {
  // Check for GEMINI_API_KEY
  if (!process.env.GEMINI_API_KEY) {
    console.error(pc.red('✗ GEMINI_API_KEY required for reference-to-brand generation'));
    console.error(pc.dim('  Set your API key: export GEMINI_API_KEY=your-key'));
    console.error(pc.dim('  Get a key at: https://makersuite.google.com/app/apikey'));
    process.exit(1);
  }

  // Import and use Gemini for concept extraction
  const { GeminiClient } = await import('../../core/gemini-client.js');
  const gemini = new GeminiClient();

  // ... analyze reference and generate on-brand version
}
```

**Step 3: Commit**

```bash
git add src/cli/commands/generate.ts
git commit -m "feat(cli): add --reference option for reference-to-brand generation"
```

---

## Phase 6: Documentation & Integration

### Task 6.1: Update brand.json Schema

**Files:**
- Modify: `brand/brand.json`

**Step 1: Add new sections**

Add to brand.json:
```json
{
  "gradients": {
    "primary": {
      "type": "linear",
      "angle": 135,
      "stops": [["#259B6C", 0], ["#05264C", 1]]
    }
  },
  "shadows": {
    "sm": { "offset": [0, 2], "radius": 4, "color": "rgba(0,0,0,0.08)" },
    "md": { "offset": [0, 4], "radius": 12, "color": "rgba(0,0,0,0.12)" },
    "lg": { "offset": [0, 8], "radius": 24, "color": "rgba(0,0,0,0.16)" }
  }
}
```

**Step 2: Commit**

```bash
git add brand/brand.json
git commit -m "feat(brand): add gradients and shadows to brand.json schema"
```

---

### Task 6.2: Create Directory Structure

**Files:**
- Create: `brand/extracted/.gitkeep`
- Create: `brand/styles/layouts/.gitkeep`
- Create: `brand/styles/color-schemes/.gitkeep`
- Create: `brand/styles/effects/.gitkeep`
- Create: `brand/styles/compositions/.gitkeep`

**Step 1: Create directories**

```bash
mkdir -p brand/extracted brand/styles/layouts brand/styles/color-schemes brand/styles/effects brand/styles/compositions
touch brand/extracted/.gitkeep brand/styles/layouts/.gitkeep brand/styles/color-schemes/.gitkeep brand/styles/effects/.gitkeep brand/styles/compositions/.gitkeep
```

**Step 2: Commit**

```bash
git add brand/extracted brand/styles
git commit -m "chore: add directory structure for Figma extraction"
```

---

## Summary

| Phase | Tasks | Files Created/Modified |
|-------|-------|----------------------|
| 1 | Types & Schema | figma-types.ts, extracted-style-types.ts |
| 2 | Extractor Core | figma-extractor.ts |
| 3 | CLI Commands | commands/figma.ts, cli/index.ts |
| 4 | MCP Tools | list-layouts.ts, list-color-schemes.ts |
| 5 | Reference-to-Brand | commands/generate.ts (modified) |
| 6 | Documentation | brand.json, directory structure |

**Total: 8 new files, 4 modified files**

---

Plan complete and saved to `docs/plans/2026-03-05-figma-style-extraction-impl.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?

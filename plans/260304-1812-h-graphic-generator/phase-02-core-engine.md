# Phase 2: Core Engine

## Overview
- **Priority:** P1 (all interfaces depend on this)
- **Status:** pending
- **Effort:** 5h
- Build shared core: type definitions, brand config loader, Satori render engine, export pipeline (SVG -> PNG/JPG/WebP).

## Context Links
- [Design Guidelines](../../docs/design-guidelines.md) — Brand Token Format, Template Contract
- [SVG/HTML Tech Research](../reports/researcher-260304-1805-svg-html-generation-tech.md)

## Key Insights
- Satori renders HTML/CSS subset to SVG (~100ms); no browser needed
- resvg converts SVG -> PNG (~50ms); Sharp handles format conversion + resize
- Brand context must be resolved before template rendering
- Satori requires font buffers loaded upfront — use `fetch` or `fs.readFile`

<!-- Updated: Validation Session 1 - Added Puppeteer as secondary renderer -->
### Dual Renderer Strategy (Validation Decision)
- **Satori**: Default for simple templates (flexbox, basic text, solid colors). Fast (~100ms).
- **Puppeteer**: Fallback for complex CSS (gradients, shadows, grid, transforms). Slower (~300ms) but full CSS.
- **Auto-detect**: Engine checks if template HTML uses unsupported Satori CSS. If so, route to Puppeteer.
- Add `puppeteer-renderer.ts` alongside engine.ts

## Requirements

### Functional
- Load and validate brand.json config
- Resolve brand tokens (colors, typography, spacing) into render-ready format
- Render HTML string to SVG via Satori
- Convert SVG to PNG, JPG, WebP via resvg + Sharp
- Support multiple output sizes from single render
- Return both buffer and file write options

### Non-functional
- Single image render < 250ms
- No browser dependency
- Graceful error handling with typed errors

## Related Code Files

### Files to Create
```
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/types.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/brand-context.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/engine.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/export-pipeline.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/font-loader.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/puppeteer-renderer.ts  # Puppeteer-based renderer for complex CSS
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/sanitize.ts           # escapeHtml, validateOutputPath, validateProps
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/index.ts              # update barrel
```

## Architecture

```
brand.json -> BrandContext.load() -> BrandConfig
                                         |
Template HTML + BrandConfig -> Engine.render() -> SVG string
                                                      |
                            ExportPipeline.export() -> PNG/JPG/WebP buffer
                                                      |
                                           fs.writeFile -> output file
```

## Implementation Steps

### 1. Define types (src/core/types.ts)

```typescript
// Brand types
export interface BrandColor {
  value: string;
  description?: string;
}

export interface BrandTypography {
  family: string;
  weight: string;
}

export interface BrandConfig {
  $schema: string;
  name: string;
  colors: Record<string, BrandColor>;
  typography: Record<string, BrandTypography>;
  spacing: {
    unit: number;
    scales: Record<string, number>;
  };
  assets: Record<string, string>;
  diagram: {
    nodeColors: Record<string, string>;
    edgeColor: string;
    borderRadius: number;
  };
}

// Template types
export interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'image';
  required: boolean;
  default?: unknown;
  description: string;
}

export interface Template {
  name: string;
  description: string;
  category: 'marketing' | 'diagram' | 'social' | 'docs';
  defaultSize: { width: number; height: number };
  props: Record<string, PropDefinition>;
  render: (props: Record<string, unknown>, brand: BrandConfig) => string;
}

// Render types
export type OutputFormat = 'svg' | 'png' | 'jpg' | 'webp';

export interface RenderOptions {
  template: string;
  props: Record<string, unknown>;
  format: OutputFormat;
  size?: { width: number; height: number };
  brandConfigPath?: string;
}

export interface RenderResult {
  buffer: Buffer;
  format: OutputFormat;
  width: number;
  height: number;
}
```

### 2. Implement font-loader (src/core/font-loader.ts)

> **[RED TEAM]** Bundle Inter-Regular.ttf (~300KB) as offline default. CDN is optional enhancement, not fallback.

Satori needs font ArrayBuffer at init. Create loader that:
1. Checks for fonts in `brand/assets/fonts/` directory
2. Falls back to **bundled** Inter-Regular.ttf (shipped with package)
3. Optionally fetches additional fonts from CDN if network available
4. Caches loaded fonts in memory

```typescript
export async function loadFonts(brandConfig: BrandConfig): Promise<SatoriFont[]> {
  // 1. Collect unique font families from brand config
  // 2. For each: try brand/assets/fonts/ first
  // 3. Fallback: bundled Inter from __dirname/../brand/assets/fonts/Inter-Regular.ttf
  // 4. Optional: try CDN for non-bundled fonts (wrapped in try/catch, never fatal)
  // 5. Must always return at least 1 font or throw clear error
}
```

### 3. Implement brand-context (src/core/brand-context.ts)

```typescript
export class BrandContext {
  private config: BrandConfig;

  static async load(configPath?: string): Promise<BrandContext> {
    // Default: brand/brand.json relative to cwd
    // Read + JSON.parse + validate schema
    // Throw typed error if invalid
  }

  getConfig(): BrandConfig { return this.config; }

  resolveColor(name: string): string {
    // Lookup color by semantic name, return hex value
  }

  resolveFont(role: string): BrandTypography {
    // Lookup typography by role (display, heading, body)
  }
}
```

Validation: check required fields exist (colors.primary, colors.text, typography.body). Throw descriptive errors for missing fields.

### 4. Implement engine (src/core/engine.ts)

```typescript
import satori from 'satori';

export class Engine {
  private fonts: SatoriFont[];

  async init(brandConfig: BrandConfig): Promise<void> {
    this.fonts = await loadFonts(brandConfig);
  }

  async renderToSvg(html: string, size: { width: number; height: number }): Promise<string> {
    // Satori expects a React-like element tree, NOT raw HTML
    // Use satori's html helper or construct virtual DOM
    // Return SVG string
    return satori(element, {
      width: size.width,
      height: size.height,
      fonts: this.fonts,
    });
  }
}
```

**CRITICAL**: Satori does NOT accept raw HTML strings. It accepts React-like element objects or uses `satori-html` package to convert HTML to compatible format. Must install `satori-html` and use its `html()` function.

```bash
npm install satori-html
```

```typescript
import { html } from 'satori-html';

// Convert HTML string to satori-compatible markup
const markup = html(templateHtml);
const svg = await satori(markup, { width, height, fonts });
```

### 5. Implement export-pipeline (src/core/export-pipeline.ts)

```typescript
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

export class ExportPipeline {
  async exportSvg(svgString: string, format: OutputFormat, size?: { width: number; height: number }): Promise<Buffer> {
    if (format === 'svg') return Buffer.from(svgString);

    // SVG -> PNG via resvg
    const resvg = new Resvg(svgString, {
      fitTo: size ? { mode: 'width', value: size.width } : undefined,
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    if (format === 'png') return Buffer.from(pngBuffer);

    // PNG -> JPG/WebP via Sharp
    const sharpInstance = sharp(Buffer.from(pngBuffer));
    if (format === 'jpg') return sharpInstance.jpeg({ quality: 90 }).toBuffer();
    if (format === 'webp') return sharpInstance.webp({ quality: 90 }).toBuffer();

    throw new Error(`Unsupported format: ${format}`);
  }
}
```

### 6. Implement sanitize utilities (src/core/sanitize.ts)

> **[RED TEAM]** Addresses HTML injection, path traversal, prop validation, and dimension caps.

```typescript
/** Escape HTML special characters in template props */
export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/** Validate output path — reject traversal, ensure within allowed dir */
export function validateOutputPath(outputPath: string, allowedDir: string = process.cwd()): string {
  const resolved = path.resolve(outputPath);
  if (!resolved.startsWith(path.resolve(allowedDir))) {
    throw new Error(`Output path "${outputPath}" is outside allowed directory`);
  }
  return resolved;
}

/** Validate template props against PropDefinition schema */
export function validateProps(template: Template, props: Record<string, unknown>): void {
  for (const [key, def] of Object.entries(template.props)) {
    if (def.required && (props[key] === undefined || props[key] === null)) {
      throw new Error(`Missing required prop "${key}" for template "${template.name}"`);
    }
  }
  // Apply defaults for missing optional props
  for (const [key, def] of Object.entries(template.props)) {
    if (props[key] === undefined && def.default !== undefined) {
      props[key] = def.default;
    }
  }
}

/** Cap render dimensions to prevent DoS */
export const MAX_DIMENSION = 4096;
export function validateDimensions(width: number, height: number): void {
  if (width > MAX_DIMENSION || height > MAX_DIMENSION || width < 1 || height < 1) {
    throw new Error(`Dimensions must be 1-${MAX_DIMENSION}px. Got ${width}x${height}`);
  }
}
```

### 7. Update barrel export (src/core/index.ts)

```typescript
export { BrandContext } from './brand-context.js';
export { Engine } from './engine.js';
export { ExportPipeline } from './export-pipeline.js';
export * from './types.js';
```

### 7. Verify build + basic smoke test

Create a minimal script that:
1. Loads brand config
2. Renders simple HTML to SVG
3. Exports to PNG
4. Writes to file

## Todo List
- [ ] Define all TypeScript types in types.ts
- [ ] Install satori-html package
- [ ] Implement font-loader.ts (local + CDN fallback)
- [ ] Implement BrandContext class (load, validate, resolve)
- [ ] Implement Engine class (init fonts, renderToSvg via satori-html)
- [ ] Implement ExportPipeline class (SVG -> PNG/JPG/WebP)
- [ ] Update core/index.ts barrel exports
- [ ] Verify build compiles
- [ ] Smoke test: render simple graphic end-to-end

## Success Criteria
- BrandContext loads and validates brand.json correctly
- Engine renders HTML string to valid SVG via Satori
- ExportPipeline converts SVG to PNG, JPG, WebP buffers
- End-to-end: template HTML -> brand-injected SVG -> PNG file on disk
- All exports compile with zero type errors

## Risk Assessment
- **Satori HTML input**: Satori doesn't accept raw HTML — needs satori-html converter
  - Mitigation: use `satori-html` package (documented above)
- **Font loading**: Satori crashes without fonts
  - Mitigation: font-loader with fallback to CDN fetch; clear error message if no fonts available
- **resvg WASM**: May need platform-specific binary
  - Mitigation: @resvg/resvg-js handles this via optionalDependencies

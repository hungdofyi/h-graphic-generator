# Phase 6: Testing

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- Set up Vitest, write unit tests for core engine + brand context + export pipeline + template registry, CLI command tests, MCP tool schema tests, and output snapshot tests.

## Context Links
- [Tech Stack](../../docs/tech-stack.md) — Vitest, snapshot testing
- [Phase 2](phase-02-core-engine.md) — Core Engine API
- [Phase 3](phase-03-template-system.md) — Template Registry
- [Phase 4](phase-04-cli-interface.md) — CLI Commands
- [Phase 5](phase-05-mcp-server.md) — MCP Tools + Resources

## Key Insights
- Vitest is Vite-native, fast, ESM-first — good fit for this project
- Snapshot tests: render templates to SVG, snapshot the SVG string (deterministic)
- Image output tests: compare PNG file size/dimensions (not pixel-perfect comparison)
- MCP tool tests: verify schema registration and handler responses
- CLI tests: use `execa` or Commander's `.parseAsync()` with test args

## Requirements

### Functional
- Unit tests for: BrandContext, Engine, ExportPipeline, TemplateRegistry
- Template render tests: each template produces valid HTML
- CLI integration tests: commands execute without error
- MCP tool tests: tool handlers return expected response shape
- Snapshot tests: SVG output stability across runs

### Non-functional
- Tests run in < 10s total
- No external network calls in tests (mock font loading)
- CI-friendly (no visual/browser deps)

## Related Code Files

### Files to Create
```
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/vitest.config.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/core/brand-context.test.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/core/engine.test.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/core/export-pipeline.test.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/templates/registry.test.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/templates/render.test.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/cli/commands.test.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/mcp/tools.test.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/fixtures/brand-config-valid.json
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/fixtures/brand-config-invalid.json
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tests/fixtures/sample-font.ttf
```

## Implementation Steps

### 1. Configure Vitest (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts'],
    },
    testTimeout: 10000,
  },
});
```

### 2. Create test fixtures

**tests/fixtures/brand-config-valid.json** — copy of brand/brand.json with all required fields.

**tests/fixtures/brand-config-invalid.json** — missing required fields (e.g., no colors.primary).

**tests/fixtures/sample-font.ttf** — small TTF font for Satori tests (use Inter subset or any open-source font). Alternatively, mock font loading entirely in tests.

### 3. BrandContext tests (tests/core/brand-context.test.ts)

```typescript
import { describe, it, expect } from 'vitest';
import { BrandContext } from '../../src/core/brand-context.js';

describe('BrandContext', () => {
  it('loads valid brand config', async () => {
    const ctx = await BrandContext.load('tests/fixtures/brand-config-valid.json');
    expect(ctx.getConfig().name).toBeDefined();
    expect(ctx.getConfig().colors.primary.value).toMatch(/^#/);
  });

  it('throws on invalid config', async () => {
    await expect(BrandContext.load('tests/fixtures/brand-config-invalid.json'))
      .rejects.toThrow();
  });

  it('throws on missing file', async () => {
    await expect(BrandContext.load('nonexistent.json'))
      .rejects.toThrow();
  });

  it('resolves color by name', async () => {
    const ctx = await BrandContext.load('tests/fixtures/brand-config-valid.json');
    expect(ctx.resolveColor('primary')).toMatch(/^#/);
  });

  it('resolves font by role', async () => {
    const ctx = await BrandContext.load('tests/fixtures/brand-config-valid.json');
    const font = ctx.resolveFont('display');
    expect(font.family).toBeDefined();
    expect(font.weight).toBeDefined();
  });
});
```

### 4. Engine tests (tests/core/engine.test.ts)

```typescript
describe('Engine', () => {
  it('renders HTML to SVG string', async () => {
    const engine = new Engine();
    await engine.init(validBrandConfig); // may need font mock
    const svg = await engine.renderToSvg(
      '<div style="display:flex;color:red;">Hello</div>',
      { width: 400, height: 200 }
    );
    expect(svg).toContain('<svg');
    expect(svg).toContain('Hello');
  });

  it('respects size parameters', async () => {
    const engine = new Engine();
    await engine.init(validBrandConfig);
    const svg = await engine.renderToSvg('<div>Test</div>', { width: 800, height: 600 });
    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="600"');
  });
});
```

**Note**: Engine tests require font loading. Either:
- Include a small TTF in fixtures
- Mock the font-loader module in tests
- Use `vi.mock()` to bypass font requirement

### 5. ExportPipeline tests (tests/core/export-pipeline.test.ts)

```typescript
describe('ExportPipeline', () => {
  const simpleSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';

  it('returns SVG as buffer when format is svg', async () => {
    const pipeline = new ExportPipeline();
    const buf = await pipeline.exportSvg(simpleSvg, 'svg');
    expect(buf.toString()).toContain('<svg');
  });

  it('converts SVG to PNG buffer', async () => {
    const pipeline = new ExportPipeline();
    const buf = await pipeline.exportSvg(simpleSvg, 'png');
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it('converts SVG to JPG buffer', async () => {
    const pipeline = new ExportPipeline();
    const buf = await pipeline.exportSvg(simpleSvg, 'jpg');
    // JPEG magic bytes: 0xFF 0xD8
    expect(buf[0]).toBe(0xFF);
    expect(buf[1]).toBe(0xD8);
  });

  it('converts SVG to WebP buffer', async () => {
    const pipeline = new ExportPipeline();
    const buf = await pipeline.exportSvg(simpleSvg, 'webp');
    expect(buf.length).toBeGreaterThan(0);
  });

  it('throws on unsupported format', async () => {
    const pipeline = new ExportPipeline();
    await expect(pipeline.exportSvg(simpleSvg, 'bmp' as any))
      .rejects.toThrow('Unsupported format');
  });
});
```

### 6. Template Registry tests (tests/templates/registry.test.ts)

```typescript
describe('TemplateRegistry', () => {
  it('registers and retrieves template by name', () => {
    // register mock template, verify get() returns it
  });

  it('lists all registered templates', () => {
    // registerBuiltinTemplates(), verify list().length === 4
  });

  it('filters templates by category', () => {
    const marketing = registry.list('marketing');
    expect(marketing.every(t => t.category === 'marketing')).toBe(true);
  });

  it('returns undefined for unknown template', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });
});
```

### 7. Template render tests (tests/templates/render.test.ts)

```typescript
describe('Template Rendering', () => {
  const brand = /* load from fixture */;

  it('hero-banner renders with title', () => {
    const tmpl = registry.get('hero-banner');
    const html = tmpl.render({ title: 'Test Title' }, brand);
    expect(html).toContain('Test Title');
    expect(html).toContain(brand.colors.primary.value);
  });

  it('feature-card renders with title and description', () => {
    const tmpl = registry.get('feature-card');
    const html = tmpl.render({ title: 'Feature', description: 'Desc' }, brand);
    expect(html).toContain('Feature');
  });

  it('diagram-flow renders nodes', () => {
    const tmpl = registry.get('diagram-flow');
    const html = tmpl.render({
      nodes: [{ id: 'a', label: 'Start' }, { id: 'b', label: 'End' }],
      edges: [{ from: 'a', to: 'b' }],
    }, brand);
    expect(html).toContain('Start');
    expect(html).toContain('End');
  });

  it('social-og renders with all props', () => {
    const tmpl = registry.get('social-og');
    const html = tmpl.render({ title: 'OG Title', description: 'Desc', author: 'Author' }, brand);
    expect(html).toContain('OG Title');
  });

  // Snapshot tests — SVG output stability
  it('hero-banner SVG snapshot', async () => {
    const engine = new Engine();
    await engine.init(brand);
    const tmpl = registry.get('hero-banner');
    const html = tmpl.render({ title: 'Snapshot Test' }, brand);
    const svg = await engine.renderToSvg(html, tmpl.defaultSize);
    expect(svg).toMatchSnapshot();
  });
});
```

### 8. CLI command tests (tests/cli/commands.test.ts)

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

describe('CLI Commands', () => {
  // [RED TEAM] Use tsx for direct TS execution — no build step dependency
  const cli = 'npx tsx src/cli/index.ts';

  it('shows help', () => {
    const output = execSync(`${cli} --help`).toString();
    expect(output).toContain('hgraphic');
    expect(output).toContain('generate');
  });

  it('lists templates', () => {
    const output = execSync(`${cli} templates list --json`).toString();
    const data = JSON.parse(output);
    expect(data.length).toBe(4);
  });

  it('validates brand config', () => {
    const output = execSync(`${cli} brand validate --json`).toString();
    const data = JSON.parse(output);
    expect(data.valid).toBe(true);
  });

  it('generates graphic with dry-run', () => {
    const output = execSync(
      `${cli} generate -t hero-banner -p '{"title":"Test"}' --dry-run --json`
    ).toString();
    const data = JSON.parse(output);
    expect(data.template).toBe('hero-banner');
    expect(data.dryRun).toBe(true);
  });

  it('generates PNG file', () => {
    const outPath = 'tests/output/test-hero.png';
    execSync(`${cli} generate -t hero-banner -p '{"title":"CLI Test"}' -o ${outPath}`);
    expect(existsSync(outPath)).toBe(true);
    unlinkSync(outPath); // cleanup
  });
});
```

> **[RED TEAM]** CLI tests use `tsx` for direct TS execution. No pre-build required.

### 9. MCP tool tests (tests/mcp/tools.test.ts)

```typescript
describe('MCP Tools', () => {
  // Test tool registration and handler responses
  // Create server instance, register tools, verify schema

  it('list_templates tool returns templates', async () => {
    // Call tool handler directly (not via stdio)
    // Verify response has content array with template data
  });

  it('validate_brand tool returns valid for good config', async () => {
    // Call validate_brand handler with fixture path
    // Verify { valid: true }
  });

  it('validate_brand tool returns invalid for bad config', async () => {
    // Call with invalid fixture
    // Verify { valid: false, error: ... }
  });

  it('generate_graphic tool produces output', async () => {
    // Call generate_graphic handler with template + props
    // Verify response contains content with text
  });
});
```

**Testing MCP handlers directly**: Import tool registration functions, create mock server object, capture handler functions, call them directly. Avoids stdio complexity in tests.

### 10. Add test scripts to package.json

Ensure package.json scripts include:
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

## Todo List
- [ ] Install vitest and @vitest/coverage-v8
- [ ] Create vitest.config.ts
- [ ] Create test fixtures (valid brand, invalid brand)
- [ ] Write BrandContext tests (load, validate, resolve)
- [ ] Write Engine tests (renderToSvg, with font mock)
- [ ] Write ExportPipeline tests (SVG/PNG/JPG/WebP conversion)
- [ ] Write TemplateRegistry tests (register, list, filter)
- [ ] Write template render tests (each template produces HTML with brand tokens)
- [ ] Write SVG snapshot tests for template output stability
- [ ] Write CLI integration tests (help, list, validate, generate)
- [ ] Write MCP tool handler tests (list_templates, validate_brand, generate_graphic)
- [ ] Verify all tests pass with `npm run test:run`
- [ ] Check coverage report for core modules

## Success Criteria
- All tests pass with `vitest run`
- Core modules (brand-context, engine, export-pipeline) have > 80% coverage
- Template render tests confirm brand token injection
- SVG snapshots are deterministic across runs
- CLI tests confirm commands execute end-to-end
- MCP tool tests confirm response shapes

## Risk Assessment
- **Font dependency in Engine tests**: Satori requires fonts
  - Mitigation: Mock font-loader or include tiny TTF fixture
- **CLI tests require build**: Tests call dist/ entry points
  - Mitigation: Use tsx for direct TS execution, or run `npm run build` in test setup
- **Snapshot fragility**: SVG output may change with Satori version updates
  - Mitigation: Pin satori version; update snapshots intentionally via `vitest --update`

# Codebase Summary — h-graphic-generator

## Project Overview

**h-graphic-generator** is a Node.js CLI tool and MCP server for generating branded graphics and diagrams. It combines Satori (HTML/CSS → SVG) with resvg and Sharp for format conversion, Gemini Vision API for style extraction, and a template system for pre-built graphics.

**Status**: Production-ready (v0.1.0)
**Repository**: Single Git repo, TypeScript source
**Build System**: tsup (ESM + CJS)
**Test Framework**: Vitest

## Key Metrics

- **Total Files**: 72 tracked (excluding node_modules, dist, coverage)
- **Source Files**: ~20 TypeScript files (core, CLI, MCP, templates)
- **Test Files**: 5 test suites
- **Documentation**: 3 markdown files (architecture, design-guidelines, tech-stack)
- **Lines of Code**: ~3,500 (source)
- **Test Code**: ~1,200 lines
- **Dependencies**: 9 production, 9 development

## Technology Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Language** | TypeScript 5.4 | Type-safe development |
| **Runtime** | Node.js 20+ | JavaScript execution |
| **Build** | tsup 8.0 | Fast bundler, ESM/CJS dual output |
| **SVG Generation** | Satori 0.12 | HTML/CSS → SVG (fast, no browser) |
| **SVG Export** | @resvg/resvg-js 2.6 | SVG → PNG/JPG (native) |
| **Image Processing** | Sharp 0.33 | Resize, format conversion, optimization |
| **Diagram DSL** | Mermaid CLI 11 | Text → flowchart/diagram |
| **CLI Framework** | Commander 12 | Command-line interface |
| **MCP Framework** | @modelcontextprotocol/sdk 1.12 | Claude Desktop integration |
| **AI Vision** | @google/genai 1.0 | Gemini Vision API for style extraction |
| **Testing** | Vitest 3.0 | Unit testing framework |
| **Linting** | ESLint 9.0 | Code quality |
| **Formatting** | Prettier 3.0 | Code style |

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         User Input                       │
├─────────────┬─────────────┬─────────────┤
│    CLI      │  MCP Server │  Library    │
└─────────────┴─────────────┴─────────────┘
              │
       ┌──────▼──────┐
       │ Core Engine │ (Satori-based)
       └──────┬──────┘
  ┌────────────┼───────────────┐
  │            │               │
┌─▼──┐    ┌────▼────┐    ┌────▼────┐
│Brand│    │Template │    │ Export  │
│Ctx  │    │Renderer │    │Pipeline │
└────┘    └─────────┘    └────┘
                            │
                    ┌───────┼───────┐
                    │       │       │
              ┌─────▼┐ ┌────▼──┐ ┌──▼────┐
              │resvg │ │Sharp  │ │Pup.   │
              └──────┘ └───────┘ └───────┘
```

## Core Modules

### Engine (`src/core/engine.ts`)
Main rendering orchestrator.

**Exports**:
- `Engine` class: Satori-based HTML → SVG renderer
- `renderHtml(html, options)`: Primary method
- `initialize()`, `cleanup()`: Lifecycle

**Dependencies**: Satori, FontLoader, BrandContext, Sanitize

**Key Features**:
- Automatic font loading from brand assets
- HTML sanitization (injection prevention)
- Size-aware rendering
- Fallback to Puppeteer for complex CSS

### Brand Context (`src/core/brand-context.ts`)
Brand token management and resolution.

**Exports**:
- `BrandContext` class: Token store and resolver
- `load(path)`: Load brand.json
- `resolveColor()`, `getTypography()`, `getSpacing()`: Token accessors

**Data Format**: W3C-aligned design tokens (colors, typography, spacing, assets)

### Export Pipeline (`src/core/export-pipeline.ts`)
SVG format conversion.

**Exports**:
- `ExportPipeline` class
- `export(svg, format, options)`: Convert to PNG/JPG/WebP/SVG

**Formats**: svg, png, jpg, webp
**Tools**: resvg (SVG → raster), Sharp (resize, optimize)

### Template System (`src/templates/registry.ts`)
Pre-built graphic templates.

**Exports**:
- `TemplateRegistry` class: Discovery and loading
- `getAllTemplates()`, `getTemplate(name)`: Accessors

**Available Templates**:
1. `feature-illustration` (1200x630) - Marketing feature highlight
2. `concept-comparison` (1200x800) - Side-by-side comparison
3. `linear-flow` (1200x400) - Process/workflow diagram
4. `process-steps` (1200x600) - Step-by-step guide

**Template Contract**:
```typescript
interface Template {
  name: string;
  description: string;
  category: 'marketing' | 'diagram' | 'social' | 'docs';
  defaultSize: { width: number; height: number };
  props: Record<string, PropDefinition>;
  render: (props: TemplateProps, brand: BrandContext) => string;
}
```

### Style Extractor (`src/core/style-extractor.ts`)
Gemini Vision API integration for design token extraction.

**Exports**:
- `StyleExtractor` class
- `extractStylesFromImages(paths)`: Analyze reference images
- `generateStyleProfile()`: Create token structure

**Input**: Reference images (PNG, JPG, WebP)
**Output**: StyleProfile with colors, typography, spacing suggestions

### Supporting Modules

| Module | Purpose |
|--------|---------|
| `FontLoader` | Font registration for Satori |
| `Sanitize` | HTML injection prevention |
| `ImageValidation` | Safety checks (size, format, dimensions) |
| `GeminiClient` | Google Vision API wrapper |
| `PuppeteerRenderer` | Fallback HTML → SVG renderer |
| `Types` | Shared TypeScript interfaces |

## User Interfaces

### CLI (`src/cli/`)
Command-line entry point using Commander.js.

**Commands**:
1. `render` - PRIMARY: HTML/CSS → image
   - Options: `--html`, `--file`, `--output`, `--format`, `--size`, `--brand`, `--renderer`
2. `generate` - Template-based generation
   - Options: `--template`, `--props`, `--output`, `--format`
3. `diagram` - Mermaid/JSON → diagram
   - Options: `--input`, `--output`, `--style`
4. `brand` - Brand management
   - Subcommands: `validate`, `extract-style`
5. `templates` - Template discovery
   - Subcommands: `list`

**Entry Point**: `dist/cli/index.js` (bin: `hgraphic`)

### MCP Server (`src/mcp/`)
Model Context Protocol server for Claude Desktop.

**Transport**: stdio (stdin/stdout)

**Tools Registered**:
1. `render_graphic` - PRIMARY: HTML/CSS → base64 image
2. `generate_from_template` - Template-based generation
3. `list_templates` - Template discovery
4. `get_style_profile` - Brand token reference
5. `validate_brand` - Config validation

**Resources**:
- `brand://config` - Full brand config
- `brand://colors` - Color palette
- `brand://typography` - Font specs
- `brand://spacing` - Spacing scales
- `brand://templates` - Template catalog

**Entry Point**: `dist/mcp/server.js` (exported in package.json)

## Testing

### Test Suites

| File | Coverage | Purpose |
|------|----------|---------|
| `engine.test.ts` | Core rendering logic | Satori HTML → SVG conversion |
| `export-pipeline.test.ts` | Format conversion | PNG/JPG/WebP export |
| `brand-context.test.ts` | Token resolution | Brand token loading and access |
| `cli-commands.test.ts` | CLI behavior | Command parsing and execution |
| `template-registry.test.ts` | Template discovery | Registry loading and prop validation |

### Running Tests
```bash
npm test                 # Watch mode
npm run test:run        # Single run
npm run test:coverage   # Coverage report
```

**Coverage Target**: 80%+ on core modules

## Build & Deployment

### Build Process
```bash
npm run build        # Compile TS → JS
npm run dev          # Watch mode
```

**Build Output** (`dist/`):
- `cli/index.js` - CLI entry point
- `mcp/server.js` - MCP server
- `core/index.js` - Library export

**Output Format**: ESM (type: "module" in package.json)

### Installation
```bash
npm install                    # Install dependencies
npm run build                  # Compile
npm run lint:fix              # Fix linting
npm test                      # Run tests
```

### Distribution
- **NPM Package**: Installable via `npm install h-graphic-generator`
- **CLI**: Global command `hgraphic` (via bin field)
- **Library**: Importable as `import { Engine } from 'h-graphic-generator'`
- **MCP Server**: Registerable in Claude Desktop config

## Configuration

### Brand Configuration (`brand/brand.json`)
Design tokens in W3C format.

**Structure**:
```json
{
  "$schema": "h-graphic-brand-v1",
  "name": "Brand Name",
  "colors": { "primary": { "value": "#0066CC" }, ... },
  "typography": { "display": { "family": "Inter", "weight": "700" }, ... },
  "spacing": { "unit": 8, "scales": { "xs": 4, ... } },
  "assets": { "logo": "path/to/logo.svg" }
}
```

### Environment Variables
- `GOOGLE_GENAI_API_KEY` - Gemini API key (for style extraction)

### Font Files
- Location: `brand/assets/fonts/`
- Supported: WOFF, TTF
- Default: Inter-Regular.woff (bundled)

## Data Flow Examples

### Render Workflow
```
User: hgraphic render --html "<div>...</div>" -o out.png
  ↓
Parse options (dimensions, paths)
  ↓
Load brand.json
  ↓
Engine.renderHtml (Satori: HTML → SVG)
  ↓
ExportPipeline.export (resvg: SVG → PNG)
  ↓
Sharp: resize to 1200x630, optimize
  ↓
fs.writeFile to output/graphic.png
```

### Template Workflow
```
User: hgraphic generate -t feature-illustration --props '{"title":"..."}'
  ↓
TemplateRegistry.get("feature-illustration")
  ↓
template.render({ title: "..." }, brandContext) → HTML string
  ↓
Engine.renderHtml (HTML → SVG)
  ↓
ExportPipeline.export (SVG → PNG)
  ↓
Output: PNG with brand colors applied
```

### MCP Workflow
```
Claude Desktop User: "Generate a feature graphic"
  ↓
Claude calls render_graphic with HTML
  ↓
MCP Server receives tool call via stdio
  ↓
BrandContext (loaded at startup)
  ↓
Engine.renderHtml + ExportPipeline
  ↓
Return base64 PNG to Claude
  ↓
Claude displays image inline
```

## Error Handling

**Validation Chain**:
1. User input (CLI options, paths)
2. File I/O (brand.json, fonts, images)
3. Brand schema (required fields)
4. HTML content (sanitization)
5. Rendering (Satori, fallback to Puppeteer)
6. Export (format support)
7. Disk I/O (permissions, disk space)

**Error Messages**:
- User-facing: High-level, actionable (from CLI)
- JSON mode: Structured error objects (for scripting)
- Debug: Stack traces (in watch mode)

## Performance

| Operation | Time |
|-----------|------|
| CLI startup | ~200ms |
| Engine init | ~50ms |
| Satori render | ~100ms |
| resvg export | ~50ms |
| Sharp processing | ~30ms |
| Total render (typical) | ~200ms |
| Gemini analysis | ~2000ms |
| Diagram generation | ~300ms |

**Optimization**:
- Satori chosen over Puppeteer (10x faster)
- Shared BrandContext across requests
- Font caching in Engine
- Lazy Puppeteer spawn (fallback only)

## Security

### Input Sanitization
- HTML: Remove script tags, event handlers
- Files: Validate paths (no traversal)
- Images: Size, format, dimension checks

### API Key Management
- Environment-only (GOOGLE_GENAI_API_KEY)
- Never committed or embedded

### Output Safety
- SVG: Optimize, remove metadata
- Images: Strip metadata, no embedded executables

## Dependencies

### Production (9 modules)
| Module | Version | Purpose |
|--------|---------|---------|
| @google/genai | ^1.0.0 | Gemini Vision API |
| @mermaid-js/mermaid-cli | ^11.0.0 | Diagram generation |
| @modelcontextprotocol/sdk | ^1.12.0 | MCP server framework |
| @resvg/resvg-js | ^2.6.0 | SVG → PNG/JPG |
| commander | ^12.0.0 | CLI framework |
| picocolors | ^1.0.0 | Terminal colors |
| puppeteer | ^23.0.0 | Fallback renderer |
| satori | ^0.12.0 | HTML/CSS → SVG |
| sharp | ^0.33.0 | Image processing |

### Development (9 modules)
- TypeScript, Vitest, ESLint, Prettier, tsup, tsx, type definitions

## File Statistics

**Source Files by Module**:
- `core/`: 10 files (~1,500 LOC)
- `cli/`: 6 files (~600 LOC)
- `mcp/`: 8 files (~800 LOC)
- `templates/`: 5 files (~400 LOC)

**Test Files**: 5 (~1,200 LOC)

**Configuration Files**: 7 (tsconfig, eslint, prettier, etc.)

**Total Tracked Files**: 72

## Development Workflow

### Setup
```bash
git clone <repo>
cd h-graphic-generator
npm install
npm run build
npm test
```

### Development Loop
```bash
npm run dev            # Watch mode
# Edit src/**/*.ts
# Changes auto-recompile
npm test               # Run tests
npm run lint:fix       # Fix linting
```

### Code Quality
- **Linting**: ESLint 9.0 (rules in eslint.config.js)
- **Formatting**: Prettier 3.0 (rules in .prettierrc)
- **Type Safety**: TypeScript strict mode
- **Testing**: Vitest with coverage

### Deployment
1. Ensure all tests pass: `npm test`
2. Build: `npm run build`
3. Lint: `npm run lint` (should have zero errors)
4. Commit changes
5. Tag version (git tag v0.x.x)
6. Push to npm (npm publish)

## Key Design Principles

1. **Unified Core Engine**: Shared logic between CLI, MCP, and library
2. **Type Safety**: Full TypeScript with no `any` types in core
3. **Fast First Path**: Satori default, Puppeteer fallback
4. **Brand as Data**: JSON tokens, not hardcoded values
5. **Modular Templates**: Composable, self-contained modules
6. **Zero Vendor Lock**: Standard formats (SVG, PNG), W3C tokens
7. **Security First**: Sanitization, validation, safe defaults

## Known Limitations

1. **Satori**: No support for WOFF2, variable fonts, some CSS properties
2. **Fonts**: Manual registration required (no auto system font discovery)
3. **Complex CSS**: Satori may not support all CSS features (Puppeteer fallback)
4. **Gemini Free Tier**: 15 requests/minute, 1500/day (rate limited)
5. **Diagram DSL**: Only Mermaid syntax supported (no custom DSL)

## Future Enhancements

1. Web-based editor UI
2. More templates (social, presentations, infographics)
3. PDF export
4. Caching layer for identical inputs
5. Batch processing (CSV input)
6. Serverless deployment wrappers
7. Brand version management
8. Custom diagram DSL

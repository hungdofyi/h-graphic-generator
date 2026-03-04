# System Architecture — h-graphic-generator

## Overview

h-graphic-generator is a dual-interface graphic generation system with a unified core engine. Users can generate branded graphics via CLI, MCP server, or programmatic library API. The system uses Satori for fast SVG generation and resvg for raster conversion.

```
┌──────────────────────────────────────────────────┐
│            USER INTERFACES                        │
├──────────────┬──────────────────┬────────────────┤
│   CLI        │   MCP Server     │  Library API   │
│ (Commander)  │  (stdio-based)   │  (TypeScript)  │
└──────┬───────┴────────┬─────────┴────────┬───────┘
       │                │                  │
       └────────────────┼──────────────────┘
                        │
       ┌────────────────▼─────────────────┐
       │       Core Engine                 │
       │   (satori-based rendering)        │
       └────────────┬──────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐  ┌──────▼────┐  ┌───────▼────┐
│ Brand  │  │  Template │  │  Export    │
│Context │  │  Renderer │  │  Pipeline  │
└────────┘  └───────────┘  └───────────┘
                                  │
                  ┌───────────────┼────────────────┐
                  │               │                │
            ┌─────▼──┐      ┌─────▼──┐      ┌─────▼──┐
            │resvg   │      │Sharp   │      │Puppeteer│
            │(PNG/J) │      │(resize)│      │(fallback)
            └────────┘      └────────┘      └────────┘
```

## Core Components

### 1. Engine (src/core/engine.ts)
Primary orchestration layer for rendering HTML/CSS to SVG.

**Responsibility**: Convert HTML string → SVG using Satori with brand tokens applied.

**Key Methods**:
- `renderHtml(html, options)`: Render HTML/CSS to SVG with specified dimensions
- `initialize()`: Setup font loaders and environment
- `cleanup()`: Release resources (browser instances)

**Features**:
- Automatic font loading from `brand/assets/fonts/`
- HTML sanitization to prevent injection attacks
- Satori renderer with fallback to Puppeteer
- Size-aware rendering (responsive to dimensions)

**Dependencies**:
- Satori (HTML/CSS → SVG, ~100ms)
- BrandContext (token resolution)
- FontLoader (system + custom fonts)
- Sanitize module (HTML injection protection)

### 2. Brand Context (src/core/brand-context.ts)
Centralized brand token management.

**Responsibility**: Load, validate, and provide access to brand configuration.

**Key Methods**:
- `static load(path)`: Load brand.json from file
- `resolveColor(key)`: Get color by semantic name (e.g., "primary", "text")
- `getTypography(level)`: Fetch font family/weight for level (display, heading, body)
- `getSpacing(scale)`: Get spacing value (xs, sm, md, lg, xl, 2xl)
- `getAsset(key)`: Resolve asset path (logo, icon, etc.)

**Data Structure** (brand.json):
```json
{
  "colors": { "primary": { "value": "#0066CC" }, ... },
  "typography": { "display": { "family": "Inter", "weight": "700" }, ... },
  "spacing": { "unit": 8, "scales": { ... } },
  "assets": { "logo": "path/to/logo.svg" }
}
```

**Validation**: Enforces W3C design token format and required fields.

### 3. Export Pipeline (src/core/export-pipeline.ts)
SVG → final format conversion.

**Responsibility**: Convert SVG to PNG, JPG, WebP, or return SVG as-is.

**Key Methods**:
- `export(svg, format, options)`: Convert SVG to specified format with dimensions

**Supported Formats**:
| Format | Tool | Speed | Quality | Use Case |
|--------|------|-------|---------|----------|
| SVG | Direct | Instant | Vector | Web, scaling |
| PNG | resvg → Sharp | ~50ms | 2x DPI | Web, social |
| JPG | resvg → Sharp | ~60ms | Lossy | Web, compression |
| WebP | resvg → Sharp | ~70ms | Modern | Web (new) |

**Image Processing** (Sharp):
- Resize/scale to requested dimensions
- Format conversion
- Optimization (remove metadata, compress)
- DPI scaling (2x for retina by default)

### 4. Template System (src/templates/registry.ts)
Pre-built graphic templates for common use cases.

**Template Contract**:
```typescript
interface Template {
  name: string;
  description: string;
  category: 'marketing' | 'diagram' | 'social' | 'docs';
  defaultSize: { width: number; height: number };
  props: Record<string, PropDefinition>;
  render: (props: TemplateProps, brand: BrandContext) => string; // HTML output
}
```

**Available Templates**:

| Template | Category | Size | Description |
|----------|----------|------|-------------|
| feature-illustration | marketing | 1200x630 | Feature highlight with title/description |
| concept-comparison | marketing | 1200x800 | Side-by-side concept comparison |
| linear-flow | diagram | 1200x400 | Process/workflow with steps |
| process-steps | docs | 1200x600 | Numbered step-by-step guide |

**Location**: `src/templates/{template-name}/index.ts`

**Rendering Flow**:
1. Template receives props (title, description, etc.)
2. Accesses BrandContext for tokens
3. Returns HTML string (embed styles inline or via CSS)
4. Engine renders HTML → SVG → final format

### 5. Style Extraction (src/core/style-extractor.ts)
Analyzes reference images and extracts design tokens via Gemini Vision API.

**Responsibility**: Generate StyleProfile from design images.

**Key Methods**:
- `extractStylesFromImages(imagePaths)`: Analyze images, return detected colors/fonts/spacing
- `generateStyleProfile(extractedColors)`: Create typed StyleProfile

**Gemini Vision Integration**:
- Analyzes reference images for dominant colors
- Detects font families (visual inference)
- Suggests spacing patterns
- Returns JSON-compatible token values

**Output** (StyleProfile):
```typescript
interface StyleProfile {
  colors: { primary: string; secondary: string; accent: string; ... };
  typography: { display: FontSpec; heading: FontSpec; body: FontSpec };
  spacing: { xs: number; sm: number; md: number; ... };
  suggestions: string[]; // Design recommendations
}
```

**Usage**:
```bash
hgraphic brand extract-style --references brand/references/
# Analyzes all images in brand/references/, outputs to stdout or saves to brand.json
```

### 6. Sanitize Module (src/core/sanitize.ts)
HTML injection prevention.

**Responsibility**: Filter unsafe HTML tags/attributes before passing to Satori.

**Blocked Elements**: script, iframe, form, input, object, embed, link (except fonts)

**Blocked Attributes**: onload, onclick, onerror, javascript:, data-binding

**Approach**: Whitelist-based filtering (only allow safe HTML/CSS).

### 7. Font Loader (src/core/font-loader.ts)
Custom and system font integration.

**Responsibility**: Register fonts with Satori renderer.

**Features**:
- Loads WOFF fonts from `brand/assets/fonts/`
- Provides system fallback fonts
- Satori requires explicit font registration (no automatic system font access)
- Supports Inter (bundled default), custom WOFF files

**Supported Formats**: WOFF, TTF (via Sharp)
**NOT Supported**: WOFF2, variable fonts (Satori limitation)

### 8. Image Validation (src/core/image-validation.ts)
Safety checks for generated/imported images.

**Checks**:
- File size limits (max 10MB)
- Dimension limits (max 4096x4096)
- Format validation (PNG, JPG, WebP only)
- MIME type verification

### 9. Gemini Client (src/core/gemini-client.ts)
Wrapper for Google Gemini Vision API.

**Responsibility**: Vision analysis for style extraction.

**Methods**:
- `analyzeImage(imageData)`: Describe image content, extract colors
- `getApiKey()`: Resolve from GOOGLE_GENAI_API_KEY env var

**Free Tier**: 15 requests/minute, 1500 requests/day

## User Interfaces

### CLI (src/cli/index.ts)
Command-line interface using Commander.js.

**Command Structure**:
```
hgraphic
├── render       # PRIMARY: HTML/CSS → image
├── generate     # Template-based generation
├── diagram      # DSL/JSON → diagram
├── brand        # Brand management
└── templates    # Template discovery
```

**CLI Features**:
- Colorized output (via picocolors)
- Progress indicators
- `--json` flag for machine-readable output
- `--dry-run` mode to preview without writing
- Error handling with detailed messages

**Entry Point**: `dist/cli/index.js` (from bin in package.json: `hgraphic`)

### MCP Server (src/mcp/server.ts)
Model Context Protocol server for Claude Desktop integration.

**Transport**: Stdio (stdin/stdout)

**Startup Flow**:
1. Load brand config from `brand/brand.json`
2. Register all tools (shared BrandContext)
3. Connect stdio transport
4. Listen for tool calls from Claude Desktop

**Configuration**:
Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "h-graphic-generator": {
      "command": "node",
      "args": ["/absolute/path/to/dist/mcp/server.js"]
    }
  }
}
```

### MCP Tools

#### render_graphic (src/mcp/tools/render-graphic.ts)
**Primary MCP tool** - Claude generates HTML/CSS, tool renders to image.

**Parameters**:
```typescript
{
  html: string;              // HTML/CSS content
  width?: number;            // Default: 1200
  height?: number;           // Default: 630
  format?: 'svg'|'png'|'jpg'|'webp';  // Default: png
}
```

**Returns**:
```typescript
{
  imageBase64: string;       // Image encoded in base64
  mimeType: string;          // image/png, image/svg+xml, etc.
  width: number;
  height: number;
  message: string;           // Confirmation message
}
```

**Workflow**:
1. Claude generates custom HTML with inline styles
2. User calls render_graphic with HTML
3. Tool uses Engine to render to SVG
4. ExportPipeline converts to requested format
5. Image returned as base64 to Claude (Claude Desktop displays inline)

#### generate_from_template (src/mcp/tools/generate-from-template.ts)
**Secondary tool** - Use pre-built templates.

**Parameters**:
```typescript
{
  templateName: string;      // e.g., "feature-illustration"
  props: Record<string, any>;  // Template-specific props
  format?: string;           // svg|png|jpg|webp
  width?: number;
  height?: number;
}
```

**Returns**: Same as render_graphic (base64 image)

**Common Template Props**:
- `title`: Main heading text
- `description`: Subtitle/body text
- `color`: Override primary color
- `icon`: Icon URL or name
- `backgroundColor`: Custom background

#### list_templates (src/mcp/tools/list-templates.ts)
**Discovery tool** - Learn available templates.

**Parameters**: None

**Returns**:
```typescript
{
  templates: {
    name: string;
    description: string;
    category: string;
    defaultSize: { width, height };
    props: Record<string, { type, description, default? }>;
  }[]
}
```

#### get_style_profile (src/mcp/tools/get-style-profile.ts)
**Reference tool** - Teach Claude how to apply brand tokens.

**Parameters**: None

**Returns**:
```typescript
{
  colors: Record<string, { value: string; description: string }>;
  typography: Record<string, FontSpec>;
  spacing: Record<string, number>;
  usageExamples: string[];  // CSS/HTML snippets
}
```

**Purpose**: Allows Claude to generate HTML that respects brand tokens.

#### validate_brand (src/mcp/tools/validate-brand.ts)
**Validation tool** - Check brand config integrity.

**Parameters**:
```typescript
{
  brandPath?: string;  // Override default brand/brand.json
}
```

**Returns**:
```typescript
{
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: BrandConfig;  // Full resolved config if valid
}
```

### Brand Resources (src/mcp/resources/brand-resources.ts)
Read-only resources exposed via MCP for discovery.

**Resource URIs**:
| URI | Description | Returns |
|-----|-------------|---------|
| `brand://config` | Full brand config | JSON |
| `brand://colors` | Color palette | { [name]: { value, description } } |
| `brand://typography` | Font specs | { [level]: FontSpec } |
| `brand://spacing` | Spacing scales | { [name]: number } |
| `brand://templates` | Template catalog | Template[] |

**Usage**: Claude can read these to understand available brand tokens before generating.

## Data Flow

### Render Workflow (Primary)
```
User Input
    ↓
CLI: hgraphic render --html "<div>..." -o out.png
    ↓
registerRenderCommand (parse options)
    ↓
BrandContext.load (brand/brand.json)
    ↓
Engine.initialize (setup fonts)
    ↓
Engine.renderHtml (Satori: HTML → SVG)
    ↓
ExportPipeline.export (resvg + Sharp: SVG → PNG)
    ↓
fs.writeFile (save to output/)
    ↓
Output: PNG file with file size, dimensions
```

### Template Workflow
```
User Input (template name + props)
    ↓
CLI: hgraphic generate -t feature-illustration --props '{"title":"..."}'
    ↓
TemplateRegistry.get (load template module)
    ↓
template.render(props, brandContext) → HTML string
    ↓
Engine.renderHtml (HTML → SVG)
    ↓
ExportPipeline.export (SVG → PNG)
    ↓
Output: PNG with brand styling applied
```

### Style Extraction Workflow
```
User Input: brand reference images
    ↓
CLI: hgraphic brand extract-style --references brand/references/
    ↓
StyleExtractor.extractStylesFromImages
    ↓
GeminiClient.analyzeImage (for each image)
    ↓
StyleProfile with { colors, typography, spacing }
    ↓
Output: JSON that can be merged into brand.json
```

### MCP Workflow
```
Claude Desktop User
    ↓
Claude asks for graphic
    ↓
Claude calls render_graphic with HTML
    ↓
MCP Server (stdio transport)
    ↓
BrandContext (shared, loaded at startup)
    ↓
Engine.renderHtml (same as CLI)
    ↓
ExportPipeline.export
    ↓
Return base64 image to Claude
    ↓
Claude Desktop displays inline
```

## Directory Structure

```
h-graphic-generator/
├── src/
│   ├── cli/
│   │   ├── index.ts                 # CLI entry point
│   │   └── commands/
│   │       ├── render.ts            # Primary render command
│   │       ├── generate.ts          # Template generation
│   │       ├── diagram.ts           # Diagram generation
│   │       ├── brand.ts             # Brand management
│   │       └── templates.ts         # Template discovery
│   ├── core/
│   │   ├── engine.ts                # Main orchestrator (HTML → SVG)
│   │   ├── brand-context.ts         # Token loader/resolver
│   │   ├── export-pipeline.ts       # SVG → PNG/JPG/WebP
│   │   ├── style-extractor.ts       # Gemini-powered token extraction
│   │   ├── gemini-client.ts         # Google Vision API wrapper
│   │   ├── font-loader.ts           # Font registration
│   │   ├── sanitize.ts              # HTML injection prevention
│   │   ├── image-validation.ts      # Safety checks
│   │   ├── puppeteer-renderer.ts    # Fallback renderer
│   │   ├── types.ts                 # Shared TypeScript types
│   │   ├── style-profile-types.ts   # Type definitions for style profiles
│   │   └── index.ts                 # Core exports
│   ├── mcp/
│   │   ├── server.ts                # MCP server setup
│   │   ├── tools/
│   │   │   ├── render-graphic.ts    # PRIMARY tool
│   │   │   ├── generate-from-template.ts
│   │   │   ├── list-templates.ts
│   │   │   ├── get-style-profile.ts
│   │   │   ├── validate-brand.ts
│   │   │   └── index.ts             # Tool registration
│   │   └── resources/
│   │       └── brand-resources.ts   # Read-only brand resources
│   └── templates/
│       ├── registry.ts              # Template discovery
│       ├── feature-illustration/
│       │   └── index.ts
│       ├── concept-comparison/
│       │   └── index.ts
│       ├── linear-flow/
│       │   └── index.ts
│       └── process-steps/
│           └── index.ts
├── tests/
│   ├── engine.test.ts
│   ├── export-pipeline.test.ts
│   ├── brand-context.test.ts
│   ├── cli-commands.test.ts
│   └── template-registry.test.ts
├── brand/
│   ├── brand.json                   # User's brand tokens
│   ├── assets/
│   │   ├── logo.svg
│   │   ├── icon.svg
│   │   └── fonts/
│   │       └── Inter-Regular.woff
│   └── references/                  # Style extraction reference images
├── docs/
│   ├── architecture.md              # This file
│   ├── design-guidelines.md
│   └── tech-stack.md
├── package.json
├── tsconfig.json
├── tsup.config.ts                   # Bundler config
├── vitest.config.ts                 # Test config
└── README.md
```

## Design Decisions

### 1. Satori as Primary Renderer
**Decision**: Use Satori for SVG generation, fallback to Puppeteer.

**Rationale**:
- Satori: ~100ms, no browser, serverless-friendly, deterministic
- Puppeteer: ~2000ms, requires browser, non-deterministic CSS rendering
- Default to fast path, fallback for complex CSS

### 2. Unified Core Engine
**Decision**: Share Engine between CLI and MCP server.

**Rationale**:
- Single source of truth for rendering logic
- Consistent output across interfaces
- Easy to test and maintain
- Scales to multiple UI layers

### 3. JSON Brand Tokens
**Decision**: Design tokens in JSON, not code.

**Rationale**:
- W3C standard format
- Machine-readable (LLM-friendly)
- Non-technical stakeholders can edit
- Version control friendly

### 4. Template Modules (TypeScript)
**Decision**: Templates as TypeScript modules, not markup files.

**Rationale**:
- Full programmatic control
- Type-safe props
- Easy integration with Engine
- Composability

### 5. Stdio-Based MCP Server
**Decision**: Use stdio transport for Claude Desktop.

**Rationale**:
- Standard MCP protocol
- No HTTP/port management
- Works in sandboxed environment
- Built-in with @modelcontextprotocol/sdk

### 6. Gemini Vision for Style Extraction
**Decision**: Use Gemini free tier API for reference image analysis.

**Rationale**:
- Free (15 req/min, 1500 req/day)
- Accurate color/font detection
- No model training needed
- Reduces manual brand setup

## Error Handling

### Validation Chain
1. **User Input**: CLI options validation (dimensions, paths)
2. **File I/O**: Brand.json existence, font file readability
3. **Brand Context**: Schema validation, required fields
4. **HTML Content**: Sanitization (injection prevention)
5. **Satori Rendering**: Fallback to Puppeteer if needed
6. **Export Pipeline**: Format support, dimension checks
7. **Disk I/O**: Directory creation, write permissions

### Error Messages
- **User-facing**: High-level, actionable messages
- **JSON mode**: Structured error objects for scripting
- **Debug**: Stack traces in watch mode

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Engine init | ~50ms | Font loading, Puppeteer spawn if fallback |
| Satori render | ~100ms | HTML → SVG |
| resvg export | ~50ms | SVG → PNG/JPG |
| Sharp processing | ~30ms | Resize, format conversion |
| Total render | ~200ms | Typical end-to-end |
| Gemini analysis | ~2000ms | Per image, network latency |
| Diagram (Mermaid) | ~300ms | Flowchart generation |

## Security Considerations

### Input Sanitization
- HTML content filtered to remove script tags, event handlers
- File paths validated (no directory traversal)
- Image files validated (size, dimensions, format)

### API Key Management
- `GOOGLE_GENAI_API_KEY` from environment only
- Never embedded in code or committed
- Free tier rate limits prevent abuse

### Output Safety
- SVG optimized to remove non-visual attributes
- PNG/JPG metadata stripped
- No embedded executables or malicious content

## Testing Strategy

### Unit Tests (Vitest)
- BrandContext: token resolution, schema validation
- Engine: HTML → SVG rendering, sanitization
- ExportPipeline: format conversion, sizing
- TemplateRegistry: discovery, prop validation
- CLI commands: argument parsing, file I/O

### E2E Tests
- Full workflow: CLI input → file output
- Format validation: PNG/JPG/SVG structural checks
- Template rendering: all templates generate valid SVG

### Test Coverage
Target: 80%+ coverage on core modules (Engine, BrandContext, ExportPipeline)

## Future Enhancements

1. **Interactive Editor**: Web UI for drag-and-drop graphic building
2. **More Templates**: Social media, presentations, infographics
3. **PDF Export**: Via headless browser
4. **Caching**: Memoize rendered SVGs for identical inputs
5. **Batch Processing**: CLI mode to generate multiple graphics from CSV
6. **Cloud Deployment**: Serverless function wrapper (AWS Lambda, Vercel)
7. **Version Management**: Brand config versioning and rollback

# Code Standards & Guidelines — h-graphic-generator

## Overview

This document defines coding standards, architectural patterns, and best practices for h-graphic-generator development. All code must follow these standards to maintain consistency, readability, and maintainability.

## Language & Runtime

- **Language**: TypeScript 5.4
- **Runtime**: Node.js 20+
- **Type Safety**: Strict mode enabled (tsconfig.json)
- **Module Format**: ESM (type: "module" in package.json)

## File Organization

### Directory Structure
```
src/
├── cli/                    # Command-line interface
│   ├── index.ts           # CLI entry point & program setup
│   └── commands/
│       ├── render.ts      # Primary render command
│       ├── generate.ts    # Template generation
│       ├── diagram.ts     # Diagram generation
│       ├── brand.ts       # Brand management
│       └── templates.ts   # Template discovery
├── core/                   # Core engine & utilities
│   ├── engine.ts          # Main Satori renderer
│   ├── brand-context.ts   # Brand token management
│   ├── export-pipeline.ts # Format conversion
│   ├── style-extractor.ts # Gemini Vision integration
│   ├── gemini-client.ts   # API wrapper
│   ├── font-loader.ts     # Font registration
│   ├── sanitize.ts        # HTML injection prevention
│   ├── image-validation.ts # Safety checks
│   ├── puppeteer-renderer.ts # Fallback renderer
│   ├── types.ts           # Shared interfaces
│   ├── style-profile-types.ts # Style-specific types
│   └── index.ts           # Core exports
├── mcp/                    # Model Context Protocol
│   ├── server.ts          # MCP server setup
│   ├── tools/
│   │   ├── render-graphic.ts
│   │   ├── generate-from-template.ts
│   │   ├── list-templates.ts
│   │   ├── get-style-profile.ts
│   │   ├── validate-brand.ts
│   │   └── index.ts       # Tool registration
│   └── resources/
│       └── brand-resources.ts # Brand resource endpoints
└── templates/              # Pre-built templates
    ├── registry.ts        # Template discovery
    ├── feature-illustration/
    │   └── index.ts
    ├── concept-comparison/
    │   └── index.ts
    ├── linear-flow/
    │   └── index.ts
    └── process-steps/
        └── index.ts

tests/                      # Test suites
├── engine.test.ts
├── export-pipeline.test.ts
├── brand-context.test.ts
├── cli-commands.test.ts
└── template-registry.test.ts
```

### File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Core module | kebab-case.ts | `brand-context.ts`, `export-pipeline.ts` |
| CLI command | kebab-case.ts | `render.ts`, `templates.ts` |
| Test file | module.test.ts | `engine.test.ts` |
| Type definition | kebab-case-types.ts | `style-profile-types.ts` |
| Directory | kebab-case | `src/cli`, `brand/assets` |
| Constants | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE`, `DEFAULT_WIDTH` |
| Classes | PascalCase | `Engine`, `BrandContext` |
| Functions | camelCase | `renderHtml()`, `resolveColor()` |
| Variables | camelCase | `brandConfig`, `outputBuffer` |

## TypeScript Guidelines

### Type Safety
- **No `any` types** in core modules (engine, brand-context, export-pipeline)
- **Strict mode enabled**: tsconfig.json includes `"strict": true`
- **Explicit return types** on all exported functions
- **Interface-based contracts** for major components

### Interfaces & Types

**Definition**: Prefer `interface` over `type` for object shapes (union types use `type`)

```typescript
// Good: Interface for objects
interface Template {
  name: string;
  description: string;
  render: (props: TemplateProps, brand: BrandContext) => string;
}

// Good: Type for unions/complex
type OutputFormat = 'svg' | 'png' | 'jpg' | 'webp';
type RenderResult = SVGString | Buffer | Error;

// Avoid: Type for simple objects (use interface instead)
type BrandColors = { [key: string]: string };
```

### Export Conventions

**Default exports**: Only for main module entry points
```typescript
// Acceptable: Module entry point
export default class Engine { ... }

// Better: Named exports with re-export
export class Engine { ... }
export type { Engine };
```

**Named exports**: Preferred for utilities, functions, types
```typescript
export function sanitizeHtml(html: string): string { ... }
export interface BrandConfig { ... }
export { BrandContext, type BrandContextOptions };
```

### Generics

Use sparingly, document purpose clearly:

```typescript
// Good: Clear purpose, well-scoped
export function loadAsset<T extends Record<string, unknown>>(
  path: string,
  schema: ZodSchema<T>
): Promise<T> { ... }

// Avoid: Over-generalization
export function process<T, U, V>(input: T): U { ... }
```

### Error Handling

All async functions handle errors explicitly:

```typescript
// Good: Explicit error handling
async function renderHtml(html: string): Promise<SVGString> {
  try {
    const svg = await satori(html, { ... });
    return svg;
  } catch (error) {
    throw new Error(`Render failed: ${(error as Error).message}`);
  }
}

// Avoid: Unhandled rejections
async function renderHtml(html: string): Promise<SVGString> {
  return await satori(html, { ... }); // No error context
}
```

## Code Style

### Formatting
- **Prettier config**: `.prettierrc` (2-space indentation)
- **Format command**: `npm run format`
- **Enforced on commit**: Git pre-commit hooks

### Linting
- **ESLint config**: `eslint.config.js`
- **Rules**: Strict, but pragmatic (no overly pedantic rules)
- **Lint command**: `npm run lint`
- **Auto-fix**: `npm run lint:fix`

### Line Length
- **Soft limit**: 80 characters
- **Hard limit**: 100 characters
- **Exception**: URLs, template literals

### Indentation & Spacing

```typescript
// 2-space indentation
export function renderHtml(html: string): Promise<string> {
  const options = {
    width: 1200,
    height: 630,
  };

  return satori(html, options);
}

// Single blank line between logical groups
class Engine {
  private satori: SatoriInstance;
  private fonts: FontRegistry;

  // Single blank line before method
  async initialize(): Promise<void> { ... }

  // No blank line within method groups
  async renderHtml(html: string): Promise<SVGString> { ... }
  async cleanup(): Promise<void> { ... }
}
```

### Variable Declarations

```typescript
// Prefer const, then let (never var in modern code)
const brandConfig = await loadBrand();
let renderCount = 0;

// Destructuring preferred
const { colors, typography } = brandContext;
const [width, height] = options.size.split('x').map(Number);

// Const objects/arrays (mutate in place)
const config = { name: 'Brand' };
config.name = 'Updated'; // OK - mutating object
```

### Naming Clarity

```typescript
// Good: Clear, descriptive names
const maxImageSize = 10 * 1024 * 1024; // 10MB
const outputBuffer = await exportPipeline.export(svg, 'png');
const resolvedColors = brandContext.resolveColors();

// Avoid: Ambiguous abbreviations
const ms = 10 * 1024 * 1024; // What is 'ms'? Milliseconds? Megabytes?
const buf = await pipeline.export(svg, 'png'); // Unclear abbreviation
const res = brandContext.resolveColors(); // 'res' could mean response or resolution
```

## Architecture Patterns

### Core Engine Pattern

The core engine follows a layered architecture:

```
1. Input Layer: Validation & parsing (HTML, options)
2. Processing Layer: Satori rendering, sanitization
3. Export Layer: Format conversion (resvg, Sharp)
4. Output Layer: File I/O or return buffer
```

**Implementation**:
```typescript
export class Engine {
  constructor(brandContext: BrandContext) { ... }

  async initialize(): Promise<void> {
    // Setup: fonts, browser instances
  }

  async renderHtml(html: string, options: RenderOptions): Promise<SVGString> {
    // Process: sanitize, render, return
  }

  async cleanup(): Promise<void> {
    // Teardown: close resources
  }
}
```

### Dependency Injection

Pass dependencies through constructors, not globals:

```typescript
// Good: Explicit dependencies
export class ExportPipeline {
  constructor(private logger?: Logger) { ... }
}

const pipeline = new ExportPipeline(logger);

// Avoid: Global state
let globalLogger: Logger;
export class ExportPipeline {
  async export() {
    globalLogger.log(...);
  }
}
```

### Command Handler Pattern

CLI commands follow a consistent structure:

```typescript
export function registerRenderCommand(program: Command): void {
  program
    .command('render')
    .description('Render HTML/CSS to image')
    .option('-i, --html <code>', 'HTML/CSS content')
    .option('-o, --output <path>', 'Output path', 'output/graphic.png')
    .option('--json', 'JSON output mode')
    .action(async (options: RenderOptions) => {
      try {
        // 1. Validate input
        if (!options.html) {
          throw new Error('--html is required');
        }

        // 2. Load dependencies
        const brandContext = await BrandContext.load(options.brand);
        const engine = new Engine(brandContext);

        // 3. Execute main logic
        await engine.initialize();
        const svg = await engine.renderHtml(options.html, ...);
        const output = await pipeline.export(svg, ...);

        // 4. Handle output
        await fs.writeFile(options.output, output);
        console.log('Success');

        // 5. Cleanup
        await engine.cleanup();
      } catch (error) {
        // Error handling
        handleError(error, options.json);
        process.exit(1);
      }
    });
}
```

### MCP Tool Pattern

MCP tools follow a request-response pattern:

```typescript
export function registerRenderGraphicTool(
  server: McpServer,
  brandContext: BrandContext
): void {
  server.tool('render_graphic',
    {
      html: { type: 'string' },
      width: { type: 'number' },
      height: { type: 'number' },
      format: { type: 'string' },
    },
    async (request) => {
      try {
        // 1. Validate input
        const { html, width, height, format } = request.params;
        if (!html) throw new Error('html required');

        // 2. Execute rendering
        const engine = new Engine(brandContext);
        await engine.initialize();
        const svg = await engine.renderHtml(html, { width, height });
        const imageBuffer = await pipeline.export(svg, format, ...);

        // 3. Format response
        return {
          content: [{
            type: 'image',
            data: imageBuffer.toString('base64'),
            mimeType: `image/${format}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }
    }
  );
}
```

## Testing Standards

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../src/core/engine';

describe('Engine', () => {
  let engine: Engine;

  beforeEach(async () => {
    // Setup
    engine = new Engine(brandContext);
    await engine.initialize();
  });

  afterEach(async () => {
    // Teardown
    await engine.cleanup();
  });

  describe('renderHtml', () => {
    it('should render HTML to SVG', async () => {
      const html = '<div>Hello</div>';
      const svg = await engine.renderHtml(html, { width: 1200, height: 630 });

      expect(svg).toContain('<svg');
      expect(svg).toContain('Hello');
    });

    it('should handle invalid HTML gracefully', async () => {
      const html = '<script>alert("xss")</script>';
      const svg = await engine.renderHtml(html, { width: 1200, height: 630 });

      expect(svg).not.toContain('script');
    });
  });
});
```

### Testing Best Practices

1. **One assertion per test** (or tightly related assertions)
2. **Descriptive test names** starting with "should"
3. **Arrange-Act-Assert** pattern
4. **Mock external dependencies** (APIs, file system)
5. **Test error paths** as well as happy paths

### Coverage Requirements

- **Core modules**: ≥80% coverage
  - engine.ts
  - brand-context.ts
  - export-pipeline.ts
  - template-registry.ts
- **CLI commands**: ≥70% coverage
- **Utilities**: ≥60% coverage

### Running Tests
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report
```

## Documentation Standards

### Code Comments

Use sparingly (code should be self-documenting):

```typescript
// Good: Explains WHY, not WHAT
// Use Satori instead of Puppeteer for 10x speed improvement
async function renderHtml(html: string): Promise<SVGString> {
  return satori(html, { ... });
}

// Avoid: Redundant comments
// Render HTML to SVG using Satori
async function renderHtml(html: string): Promise<SVGString> {
  return satori(html, { ... });
}

// Good: Complex algorithm explanation
// Color extraction: Sample dominant colors from image edges
// to avoid watermarks/borders affecting token detection
const dominantColors = extractEdgeColors(image);
```

### JSDoc for Public APIs

```typescript
/**
 * Render HTML/CSS to SVG using Satori renderer.
 *
 * @param html - HTML/CSS string to render
 * @param options - Render options (width, height)
 * @returns SVG string output
 * @throws Error if HTML is invalid or rendering fails
 *
 * @example
 * const svg = await engine.renderHtml('<div>Hello</div>', {
 *   width: 1200,
 *   height: 630,
 * });
 */
export async function renderHtml(
  html: string,
  options: RenderOptions
): Promise<SVGString> {
  // ...
}
```

### README & Architecture Docs

Keep in `docs/` directory:
- `architecture.md` - System design, data flow, components
- `codebase-summary.md` - Overview, modules, testing
- `code-standards.md` - This file (standards, patterns, guidelines)
- `design-guidelines.md` - Design decisions, trade-offs
- `tech-stack.md` - Technology choices, versions

## Git & Version Control

### Commit Message Format

Use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

```
feat(engine): add Puppeteer fallback renderer
fix(cli): handle missing output directory
docs(architecture): update component diagrams
refactor(export-pipeline): simplify format detection
test(brand-context): add token resolution tests
chore(deps): upgrade Satori to 0.12.0
```

### Branch Naming

```
feature/descriptive-name          # New feature
fix/issue-description             # Bug fix
refactor/component-reorganization # Code reorganization
docs/guide-name                   # Documentation
```

### Pull Request Checklist

Before merging:
- [ ] All tests pass: `npm test`
- [ ] Code formatted: `npm run format`
- [ ] No lint errors: `npm run lint`
- [ ] Types valid: `npm run typecheck`
- [ ] Documentation updated
- [ ] No breaking changes (or noted in PR)

## Security Guidelines

### Input Validation

All user inputs must be validated:

```typescript
// Good: Explicit validation
export async function render(options: RenderOptions): Promise<void> {
  if (!options.html && !options.file) {
    throw new Error('Either --html or --file required');
  }

  // Validate dimensions
  const [width, height] = options.size.split('x').map(Number);
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid dimensions (use WxH, e.g., 1200x630)');
  }

  // Sanitize HTML
  const cleanHtml = sanitizeHtml(options.html);
  // ...
}
```

### HTML Sanitization

Remove dangerous elements before rendering:

```typescript
export function sanitizeHtml(html: string): string {
  const blockedTags = ['script', 'iframe', 'form', 'input', 'object'];
  const blockedAttrs = ['onload', 'onclick', 'onerror', 'javascript:'];

  let sanitized = html;

  // Remove blocked tags
  for (const tag of blockedTags) {
    sanitized = sanitized.replace(
      new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi'),
      ''
    );
  }

  // Remove dangerous attributes
  for (const attr of blockedAttrs) {
    sanitized = sanitized.replace(
      new RegExp(`${attr}[^\\s]*`, 'gi'),
      ''
    );
  }

  return sanitized;
}
```

### Secrets Management

Never commit secrets:

```typescript
// Good: Read from environment
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_GENAI_API_KEY environment variable required');
}

// Avoid: Hardcoded keys
const apiKey = 'AIza...'; // NEVER!
```

## Performance Guidelines

### Optimization Priorities

1. **Algorithm complexity**: O(n) preferred over O(n²)
2. **Memory efficiency**: Avoid large intermediate arrays
3. **I/O batching**: Combine file operations
4. **Caching**: Memoize expensive computations (tokens, fonts)

### Performance Budgets

| Operation | Budget | Target |
|-----------|--------|--------|
| Render HTML → SVG | 200ms | 100ms |
| Export SVG → PNG | 100ms | 50ms |
| CLI startup | 1000ms | 500ms |
| MCP server startup | 1000ms | 500ms |

### Profiling

```bash
# Node.js built-in profiling
node --prof dist/cli/index.js render ...
node --prof-process isolate-*.log > profile.txt
```

## Dependency Management

### Adding Dependencies

Before adding:
1. Check if already available in node_modules
2. Evaluate alternatives (size, maintenance, security)
3. Pin exact version in package.json
4. Document reason for dependency

### Approved Dependencies

**Production**:
- Satori (HTML → SVG)
- resvg-js (SVG → PNG)
- Sharp (image processing)
- Commander.js (CLI)
- @modelcontextprotocol/sdk (MCP)
- @google/genai (Gemini API)

**Development**:
- TypeScript, tsup, ESLint, Prettier
- Vitest (testing)
- tsx (dev runner)

### Forbidden Dependencies

- Heavy frameworks (Express, NestJS) unless absolutely necessary
- Multiple testing frameworks (Vitest only)
- Outdated or unmaintained packages

## Troubleshooting

### Common Linting Errors

| Error | Solution |
|-------|----------|
| "no-console" | Use proper logging, not console.log |
| "unused-vars" | Remove or use underscore prefix (_unused) |
| "no-any" | Provide explicit types instead |

### Type Checking Issues

```bash
# Check types without building
npm run typecheck

# Specific file
npx tsc src/core/engine.ts --noEmit
```

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-04 | Initial code standards document |

---

**Last Updated**: 2026-03-04
**Maintainers**: Development Team

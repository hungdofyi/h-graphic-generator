# Phase 5: MCP Server

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 6h
- Implement MCP server exposing graphic generation tools + brand resources via @modelcontextprotocol/sdk. Stdio transport for Claude Desktop / Claude Code integration.

## Context Links
- [Design Guidelines](../../docs/design-guidelines.md) — MCP Tools, Resources
- [Architecture Research](../reports/researcher-260304-1805-architecture-approaches.md) — MCP Server Approach
- [Phase 2](phase-02-core-engine.md) — Core Engine API
- [Phase 3](phase-03-template-system.md) — Template Registry

## Key Insights
- MCP SDK uses `server.tool(name, schema, handler)` for tool registration
- Resources served via `server.resource(uriTemplate, handler)` — LLM sees brand tokens as context
- Stdio transport: server runs as subprocess, JSON-RPC over stdin/stdout
- Stateless per-request — each tool call is independent
- Tool parameters must have JSON Schema definitions for LLM to understand

## Requirements

### Functional
<!-- Updated: Validation Session 1 - Reworked tools for sketch/prompt → branded graphic workflow -->

### MCP Design Philosophy
Claude is the creative engine — it analyzes sketches or prompts and writes HTML/CSS. Our MCP server is the **rendering engine** — it takes Claude's HTML/CSS and renders it to images with brand context.

- 5 MCP tools: **render_graphic** (primary), generate_from_template, generate_diagram, list_templates, validate_brand
- 1 MCP resource: brand://config (full brand JSON + component library reference)
- Stdio transport (required for Claude Desktop)
- JSON Schema parameter definitions for all tools
- Return base64-encoded images or file paths in tool responses

### Non-functional
- Server startup < 2s
- Tool response < 500ms for typical renders
- Clear error messages in tool responses (LLM must understand failures)

## Architecture

```
Claude Desktop / Claude Code
    |
    | stdio (JSON-RPC)
    |
MCP Server (src/mcp/server.ts)
    |
    |-- Tools --> Core Engine (render + export)
    |-- Resources --> Brand Config (JSON served to LLM)
```

## Related Code Files

### Files to Create
```
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/server.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/generate-graphic.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/generate-diagram.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/list-templates.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/validate-brand.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/export-graphic.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/resources/brand-resources.ts
```

## Implementation Steps

### 1. MCP Server entry point (src/mcp/server.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/brand-resources.js';

const server = new McpServer({
  name: 'h-graphic-generator',
  version: '0.1.0',
});

// [RED TEAM] Load brand config ONCE at startup, share across all handlers
const brandContext = await BrandContext.load();

// Register all tools and resources with shared brand context
registerTools(server, brandContext);
registerResources(server, brandContext);

// Start stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. render_graphic tool — PRIMARY TOOL (src/mcp/tools/render-graphic.ts)

<!-- Updated: Validation Session 1 - This is the core tool. Claude sends HTML/CSS, tool renders to image. -->
```typescript
server.tool(
  'render_graphic',
  {
    html: z.string().describe('HTML/CSS code for the graphic. Use brand tokens from brand://config resource.'),
    width: z.number().default(1200).describe('Output width in pixels'),
    height: z.number().default(630).describe('Output height in pixels'),
    format: z.enum(['svg', 'png', 'jpg', 'webp']).default('png'),
    renderer: z.enum(['auto', 'satori', 'puppeteer']).default('auto').describe('Renderer: auto detects CSS complexity'),
    outputPath: z.string().optional().describe('File path to save output'),
  },
  async ({ html, width, height, format, renderer, outputPath }) => {
    // 1. validateDimensions(width, height)
    // 2. If outputPath: validateOutputPath()
    // 3. Auto-detect renderer: check if HTML uses complex CSS → Puppeteer, else → Satori
    // 4. Render HTML to SVG/image
    // 5. Export via pipeline
    // 6. Write file or return base64
  }
);
```

**This is the primary tool.** When marketing describes a graphic or provides a sketch:
1. Claude reads brand://config for colors/fonts/spacing
2. Claude writes HTML/CSS code implementing the graphic
3. Claude calls render_graphic with the HTML
4. Tool renders to image and returns it

### 3. generate_from_template tool (src/mcp/tools/generate-from-template.ts)

Shortcut tool for using pre-built templates. Calls render_graphic internally.
```typescript
server.tool(
  'generate_from_template',
  {
    template: z.string().describe('Template name (e.g., feature-illustration, process-steps)'),
    data: z.record(z.unknown()).describe('Template props'),
    format: z.enum(['svg', 'png', 'jpg', 'webp']).default('png'),
    outputPath: z.string().optional(),
  },
  async ({ template, data, format, outputPath }) => {
    // 1. Lookup template, validateProps, render HTML from template
    // 2. Pass HTML to same render pipeline as render_graphic
  }
);
```

### 4. generate_diagram tool (src/mcp/tools/generate-diagram.ts)

```typescript
server.tool(
  'generate_diagram',
  {
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.string().optional(),
    })).describe('Diagram nodes'),
    edges: z.array(z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
    })).describe('Connections between nodes'),
    title: z.string().optional().describe('Diagram title'),
    format: z.enum(['svg', 'png', 'jpg', 'webp']).default('png'),
    outputPath: z.string().optional(),
  },
  async ({ nodes, edges, title, format, outputPath }) => {
    // Use diagram-flow template with nodes/edges as props
    // Same render + export flow as generate_graphic
  }
);
```

### 4. list_templates tool (src/mcp/tools/list-templates.ts)

```typescript
server.tool(
  'list_templates',
  {
    category: z.enum(['marketing', 'diagram', 'social', 'docs']).optional()
      .describe('Filter by template category'),
  },
  async ({ category }) => {
    const templates = registry.list(category);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(templates.map(t => ({
          name: t.name,
          description: t.description,
          category: t.category,
          defaultSize: t.defaultSize,
          props: Object.entries(t.props).map(([key, def]) => ({
            name: key,
            type: def.type,
            required: def.required,
            description: def.description,
          })),
        })), null, 2),
      }],
    };
  }
);
```

### 5. validate_brand tool (src/mcp/tools/validate-brand.ts)

```typescript
server.tool(
  'validate_brand',
  {
    configPath: z.string().default('brand/brand.json')
      .describe('Path to brand configuration file'),
  },
  async ({ configPath }) => {
    try {
      const brand = await BrandContext.load(configPath);
      const config = brand.getConfig();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: true,
            name: config.name,
            colorsCount: Object.keys(config.colors).length,
            typographyRoles: Object.keys(config.typography),
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ valid: false, error: error.message }),
        }],
      };
    }
  }
);
```

> **[RED TEAM]** `export_graphic` tool removed — redundant with `generate_graphic`.

### 6. Brand resources (src/mcp/resources/brand-resources.ts)

```typescript
> **[RED TEAM]** Reduced to 1 resource. Uses shared brandContext from startup.
> **[VALIDATION]** Resource now includes component library reference + CSS helpers for Claude to use when generating HTML.

```typescript
export function registerResources(server: McpServer, brandContext: BrandContext): void {
  // brand://config — full brand config + CSS helper classes + component snippets
  server.resource(
    'brand-config',
    'brand://config',
    async (uri) => {
      const config = brandContext.getConfig();
      // Augment with CSS helper reference for Claude
      const cssHelpers = generateBrandCssHelpers(config); // utility classes using brand tokens
      const componentSnippets = getComponentSnippets(); // reusable HTML snippets (cards, badges, connectors)
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({
            brand: config,
            cssHelpers, // e.g., ".brand-primary { color: #0066CC }", ".brand-card { ... }"
            components: componentSnippets, // reusable HTML building blocks
            rendererNotes: 'Satori supports: flexbox, basic text, colors, borders. For shadows/gradients/grid, set renderer=puppeteer.',
          }, null, 2),
        }],
      };
    }
  );
}
```

**Why CSS helpers + components?** When Claude reads this resource, it gets:
1. Brand tokens (colors, fonts, spacing) for consistent styling
2. Pre-built CSS classes it can use in generated HTML
3. Reusable component snippets (icon card, connector arrow, badge, etc.)
4. Renderer compatibility notes (what CSS works in Satori vs needs Puppeteer)
```

### 7. Tool index barrel (src/mcp/tools/index.ts)

```typescript
export function registerTools(server: McpServer, brandContext: BrandContext): void {
  registerGenerateGraphicTool(server, brandContext);
  registerGenerateDiagramTool(server, brandContext);
  registerListTemplatesTool(server);
  registerValidateBrandTool(server);
}
```

### 9. Claude Desktop configuration

Document how to add to Claude Desktop config:
```json
{
  "mcpServers": {
    "h-graphic-generator": {
      "command": "node",
      "args": ["path/to/dist/mcp/server.js"]
    }
  }
}
```

## Todo List
- [ ] Install zod (peer dep of @modelcontextprotocol/sdk for schema validation)
- [ ] Implement MCP server entry point with stdio transport
- [ ] Implement generate_graphic tool with full render pipeline
- [ ] Implement generate_diagram tool using diagram-flow template
- [ ] Implement list_templates tool with category filter
- [ ] Implement validate_brand tool with error reporting
- [ ] Implement export_graphic tool for SVG-to-raster conversion
- [ ] Implement 5 brand resources (config, colors, typography, templates, assets)
- [ ] Create tools/index.ts barrel that registers all tools
- [ ] Test: start server, verify tools/list and resources/list respond
- [ ] Document Claude Desktop config setup in README

## Success Criteria
- `node dist/mcp/server.js` starts without error, responds to JSON-RPC
- All 5 tools appear in tools/list response
- All 5 resources appear in resources/list response
- generate_graphic produces image file or base64 response
- validate_brand returns valid/invalid with details
- list_templates returns template catalog with prop schemas
- Resources serve correct brand data subsets

## Risk Assessment
- **MCP SDK API changes**: SDK is evolving; API may differ from docs
  - Mitigation: Pin SDK version in package.json; reference latest SDK examples
- **Base64 response size**: Large images may exceed MCP message limits
  - Mitigation: Default to file output; only return base64 for small images or SVG
- **Zod dependency**: MCP SDK may or may not include zod
  - Mitigation: Check if zod is peer dep; install explicitly if needed

## Security Considerations
- File write paths: validate outputPath to prevent directory traversal
- Brand config path: validate file exists and is readable
- SVG input (export_graphic): sanitize to prevent XXE attacks

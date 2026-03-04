# h-graphic-generator

CLI and MCP server for generating branded graphics and diagrams using HTML/CSS with AI-powered styling via Gemini Vision API.

## Features

- **Primary Workflow**: Render HTML/CSS directly to PNG/SVG/JPG/WebP (Satori + resvg)
- **Template System**: 4 pre-built templates (feature-illustration, concept-comparison, linear-flow, process-steps)
- **MCP Server**: 5 tools for Claude Desktop integration with brand-aware generation
- **Brand Tokens**: Design system enforcement (colors, typography, spacing, assets)
- **Style Extraction**: Gemini Vision API analyzes reference images and extracts design tokens
- **Multiple Formats**: SVG, PNG, JPG, WebP output with configurable sizing

## Quick Start

### Installation
```bash
npm install
npm run build
```

### Primary Workflow: Render HTML to Image
```bash
hgraphic render --html "<div style='background:blue'>Hello</div>" -o output.png

# From HTML file
hgraphic render --file template.html -o output.png --format png --size 1200x630
```

### Template-Based Generation
```bash
# Generate from template
hgraphic generate -t feature-illustration --props '{"title":"My Feature","description":"Details"}' -o feature.png

# List available templates
hgraphic templates list
```

### Brand Management
```bash
# Validate brand config
hgraphic brand validate

# Extract styles from reference images using Gemini Vision
hgraphic brand extract-style --references brand/references
```

### Diagram Generation
```bash
# Generate diagram from JSON nodes
hgraphic diagram -i nodes.json -o diagram.png

# Or from Mermaid syntax
hgraphic diagram -i "graph TD; A-->B" -o diagram.png
```

## MCP Server Setup (Claude Desktop)

1. Build the project: `npm run build`
2. Add to Claude Desktop config at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "h-graphic-generator": {
      "command": "node",
      "args": ["/absolute/path/to/h-graphic-generator/dist/mcp/server.js"]
    }
  }
}
```

3. Restart Claude Desktop

### Available MCP Tools
- **render_graphic**: Render HTML/CSS to image (primary tool)
- **generate_from_template**: Create graphic from pre-built template
- **list_templates**: Discover available templates with previews
- **get_style_profile**: Learn brand token values and usage examples
- **validate_brand**: Check brand config integrity

## Brand Configuration

Configure your brand in `brand/brand.json`:

```json
{
  "$schema": "h-graphic-brand-v1",
  "name": "My Brand",
  "colors": {
    "primary": { "value": "#0066CC", "description": "Main brand color" },
    "secondary": { "value": "#FF6B35" },
    "background": { "value": "#FFFFFF" },
    "text": { "value": "#1A1A2E" },
    "muted": { "value": "#6B7280" }
  },
  "typography": {
    "display": { "family": "Inter", "weight": "700" },
    "heading": { "family": "Inter", "weight": "600" },
    "body": { "family": "Inter", "weight": "400" }
  },
  "spacing": {
    "unit": 8,
    "scales": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32, "2xl": 48 }
  },
  "assets": {
    "logo": "assets/logo.svg"
  }
}
```

### Brand Assets Directory
```
brand/
├── brand.json              # Brand token definition
├── assets/
│   ├── logo.svg           # Brand logo
│   ├── icon.svg           # Brand icon
│   └── fonts/
│       └── Inter-Regular.woff  # Custom fonts (optional)
└── references/            # Reference images for style extraction
    ├── design-1.png
    └── design-2.png
```

## Development

```bash
npm run dev           # Watch mode (incremental builds)
npm run test          # Run tests (Vitest)
npm run test:run      # Single test run
npm run lint          # Lint code
npm run lint:fix      # Auto-fix linting issues
npm run typecheck     # Type validation
npm run format        # Format code
```

## CLI Reference

### render Command (Primary)
```bash
hgraphic render [OPTIONS]

Options:
  -i, --html <code>          HTML/CSS string to render
  -f, --file <path>          HTML file path
  -o, --output <path>        Output file (default: output/graphic.png)
  --format <format>          svg|png|jpg|webp (default: png)
  -s, --size <WxH>           Dimensions like 1200x630 (default: 1200x630)
  -b, --brand <path>         Brand config path (default: brand/brand.json)
  -r, --renderer <type>      satori|puppeteer|auto (default: auto)
  --json                     Machine-readable JSON output
```

### generate Command
```bash
hgraphic generate [OPTIONS]

Options:
  -t, --template <name>      Template name (required)
  --props <json>             Template props as JSON
  -o, --output <path>        Output file (default: output/graphic.png)
  --format <format>          svg|png|jpg|webp (default: png)
  --size <WxH>               Custom dimensions
  --json                     Machine-readable JSON output
```

### diagram Command
```bash
hgraphic diagram [OPTIONS]

Options:
  -i, --input <data>         JSON nodes or Mermaid syntax
  -o, --output <path>        Output file (default: output/diagram.png)
  --style <style>            branded (applies brand colors)
  --format <format>          svg|png|jpg|webp (default: png)
```

### brand Command
```bash
hgraphic brand validate     # Validate brand.json schema
hgraphic brand extract-style --references <dir>  # Extract styles via Gemini
```

### templates Command
```bash
hgraphic templates list     # Show all templates
```

## Architecture

See [docs/architecture.md](./docs/architecture.md) for system design, component interactions, and data flow.

## Project Status

- **Completed**: Core engine, CLI, MCP server, template system, brand tokens, Gemini-powered style extraction
- **Test Coverage**: Unit tests for core engine, CLI commands, templates, and export pipeline
- **Production Ready**: Yes - all core features implemented and tested

## License

MIT

# Design Guidelines — h-graphic-generator

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              User Interfaces                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │   CLI   │  │   MCP    │  │  Library   │  │
│  │Commander│  │  Server  │  │  Import    │  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  │
│       └─────────┬──┘──────────────┘         │
│            ┌────▼─────┐                     │
│            │  Core     │                     │
│            │  Engine   │                     │
│            └────┬─────┘                     │
│       ┌─────────┼──────────┐                │
│  ┌────▼───┐ ┌───▼────┐ ┌──▼──────┐        │
│  │ Brand  │ │Template│ │ Export  │        │
│  │Context │ │Renderer│ │Pipeline │        │
│  └────────┘ └────────┘ └─────────┘        │
└─────────────────────────────────────────────┘
```

## CLI Interface

### Commands
```bash
# Generate graphic from template
hgraphic generate --template <name> --output <path> [--format png|svg|jpg|webp]

# Generate diagram from DSL or description
hgraphic diagram --input <file|text> --output <path> [--style branded]

# Validate brand config
hgraphic brand validate --config <path>

# List available templates
hgraphic templates list

# Export at specific sizes
hgraphic generate --template hero --size 1200x630 --size 800x400
```

### CLI UX Principles
- Sensible defaults (PNG, current brand, auto-size)
- Colorized terminal output with progress indicators
- `--json` flag for machine-readable output
- `--dry-run` to preview without writing files

## MCP Server Interface

### Tools Exposed
| Tool | Description | Parameters |
|------|-------------|------------|
| `generate_graphic` | Generate branded graphic | template, data, format, size |
| `generate_diagram` | Generate branded diagram | input (DSL/description), style |
| `list_templates` | List available templates | category (optional) |
| `validate_brand` | Validate brand config | config path |
| `export_graphic` | Export existing SVG to format | svg content, format, sizes[] |

### Resources Served
| URI | Description |
|-----|-------------|
| `brand://config` | Full brand configuration JSON |
| `brand://colors` | Color palette with semantic names |
| `brand://typography` | Font families and scales |
| `brand://templates` | Available template catalog |
| `brand://assets` | Available brand assets (logos, icons) |

## Brand Token Format

```json
{
  "$schema": "h-graphic-brand-v1",
  "name": "Company Brand",
  "colors": {
    "primary": { "value": "#0066CC", "description": "Main brand color" },
    "secondary": { "value": "#FF6B35", "description": "Accent color" },
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
    "logo": "assets/logo.svg",
    "icon": "assets/icon.svg",
    "watermark": "assets/watermark.svg"
  },
  "diagram": {
    "nodeColors": { "default": "#E8F0FE", "accent": "#FFF3E0" },
    "edgeColor": "#6B7280",
    "borderRadius": 8
  }
}
```

## Template System

### Template Structure
Each template is a self-contained module:
```
templates/
├── hero-banner/
│   ├── index.ts        # Template definition + render function
│   └── preview.svg     # Visual preview
├── feature-card/
│   └── index.ts
├── diagram-flow/
│   └── index.ts
└── social-og/
    └── index.ts
```

### Template Contract
```typescript
interface Template {
  name: string;
  description: string;
  category: 'marketing' | 'diagram' | 'social' | 'docs';
  defaultSize: { width: number; height: number };
  props: Record<string, PropDefinition>;
  render: (props: TemplateProps, brand: BrandConfig) => string; // Returns HTML/SVG
}
```

## Directory Structure

```
src/
├── core/
│   ├── engine.ts              # Main render orchestration
│   ├── brand-context.ts       # Brand token loader + resolver
│   ├── export-pipeline.ts     # SVG → PNG/JPG/WebP conversion
│   └── types.ts               # Shared types
├── cli/
│   ├── index.ts               # CLI entry point
│   └── commands/
│       ├── generate.ts
│       ├── diagram.ts
│       ├── brand.ts
│       └── templates.ts
├── mcp/
│   ├── server.ts              # MCP server setup
│   └── tools/
│       ├── generate-graphic.ts
│       ├── generate-diagram.ts
│       └── list-templates.ts
└── templates/
    ├── registry.ts            # Template discovery + registry
    ├── hero-banner/
    ├── feature-card/
    ├── diagram-flow/
    └── social-og/

brand/                         # User's brand config (not in src/)
├── brand.json
└── assets/
    ├── logo.svg
    └── icon.svg
```

## Output Quality Standards
- SVG output must be valid and optimized (no redundant attributes)
- PNG output at 2x resolution by default for retina displays
- All outputs must pass brand validation (correct colors, fonts)
- Templates must be responsive to different size parameters

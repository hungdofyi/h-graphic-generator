# h-graphic-generator

MCP server for generating branded graphics with Claude. Render HTML/CSS to PNG/SVG/JPG/WebP with brand-aware styling.

## Quick Start (MCP)

### 1. Build

```bash
npm install && npm run build
```

### 2. Configure Claude

**Working in this repo?** Claude Code auto-connects via `.mcp.json` — no config needed.

**For other projects**, add to `~/.claude.json`:

```json
{
  "projects": {
    "/path/to/your-project": {
      "mcpServers": {
        "h-graphic": {
          "command": "node",
          "args": ["/path/to/h-graphic-generator/dist/mcp/server.js"]
        }
      }
    }
  }
}
```

### 3. Start Using

Just ask Claude to create graphics:

```
Create a pricing comparison graphic with 3 tiers
```

> **Tip for Best Results**
>
> Start with a simple, high-level request. The AI will ask clarifying questions about style, layout, and details - this produces better output than providing all specifications upfront.
>
> | Approach | Example | Result |
> |----------|---------|--------|
> | **Better** | "Create a diagram showing user authentication flow" | AI asks about nodes, connections, style → tailored output |
> | **Worse** | "Create a 1400x600 diagram with User→Auth→DB nodes, left-to-right, output/auth.png" | AI skips questions → may miss optimal styling |
>
> If you provide dimensions, output path, and full content upfront, the AI assumes you've finalized requirements and skips the guided workflow.

> **Exporting to Figma**
>
> To add graphics to an existing Figma file, provide the Figma URL in your prompt:
> ```
> Create a pricing card and add to figma.com/design/abc123/My-Design-System
> ```
> Without a URL, the AI creates a new Figma file. The `fileKey` is extracted from URLs like `figma.com/design/{fileKey}/...`

## MCP Tools

| Tool | Purpose |
|------|---------|
| `get_style_profile` | Get brand tokens (colors, typography, spacing) |
| `list_patterns` | Browse style libraries, components, and recipes |
| `get_pattern` | Get styles, components, or recipes |
| `list_icons` | Browse 300+ brand icons by category |
| `render_graphic` | Render HTML/CSS to image |
| `serve_preview` | Start local server for Figma export |
| `stop_preview` | Stop preview server |
| `list_templates` | List pre-built templates |
| `generate_from_template` | Create graphic from template |
| `validate_brand` | Check brand config integrity |

## Generation Workflow

Claude follows this workflow automatically:

1. **Get brand tokens** - `get_style_profile` for colors, typography, spacing
2. **Explore patterns** - `list_patterns` to discover design categories
3. **Get context styles** - `get_pattern` for backgrounds, containers, typography
4. **Generate HTML/CSS** - Design shapes with CSS (not icon library)
5. **Render to image** - `render_graphic` with the HTML

**Output:** Images are saved to the `output/` folder by default.

## Pattern Categories (Style Libraries)

| Category | Examples |
|----------|----------|
| `marketing-graphics` | Campaign banners, mesh gradients, before/after |
| `landing-page` | Pricing cards, feature grids, hero sections |
| `docs-diagrams` | Technical diagrams, architecture flows |
| `docs-explainers` | Step-by-step explainers, code blocks |
| `docs-illustrations` | Dashboard mockups, navigation trees |
| `in-app-graphics` | Data connections, dashboard publishing |
| `in-app-spot-illustrations` | Empty states, chart previews |

## Components & Recipes (Composable System)

**Components** (`brand/components/`): Reusable styling rules
- `nodes/` - box, step-indicator, connection-dot
- `connectors/` - elbow, straight, branch
- `containers/` - code-block, tooltip, frosted-card, dashboard-mockup
- `highlights/` - code-highlight, spotlight, screenshot-overlay
- `backgrounds/` - gradients, mesh
- `layouts/` - stacked-cards, layered-windows, radial-network
- `typography/` - docs, marketing

**Recipes** (`brand/recipes/`): Composition guides
- `diagrams/` - architecture-flow, data-flow
- `annotations/` - screenshot-highlight
- `marketing/` - spotlight-feature, layered-showcase, config-preview, radial-network

Access via MCP: `get_pattern("component:nodes/box")` or `get_pattern("recipe:marketing/spotlight-feature")`

## Brand Configuration

Configure your brand in `brand/brand.json`:

```json
{
  "$schema": "h-graphic-brand-v1",
  "name": "My Brand",
  "colors": {
    "primary": { "value": "#05264C" },
    "secondary": { "value": "#259B6C" },
    "background": { "value": "#FFFFFF" },
    "text": { "value": "#13151A" }
  },
  "typography": {
    "fonts": {
      "primary": "Inter",
      "display": "Inter Display",
      "code": "JetBrains Mono"
    },
    "weights": {
      "regular": "400",
      "medium": "500",
      "semiBold": "600"
    }
  }
}
```

### Typography Rules

- **Inter** - Body text, UI elements, small text
- **Inter Display** - Headings, titles, large text (24px+)
- **JetBrains Mono** - Code blocks, technical content
- **Sentence case only** - Never use ALL CAPS

### Brand Assets

```
brand/
├── brand.json            # Source of truth
├── components/           # 25 reusable component definitions
├── recipes/              # 7 composition guides
├── workflow/             # AI guidance (intake, creative, checklist)
├── svg/                  # Organized SVG templates
├── assets/fonts/
│   ├── static/           # For Satori (Inter, InterDisplay, JetBrainsMono)
│   └── variable/         # For Puppeteer CSS
├── data/                 # Logos, icons (300+)
└── extracted/            # Legacy Figma-extracted patterns
```

### Color Hierarchy

- **Green** (50-900): PRIMARY accent
- **Blue** (50-800): Secondary; Navy (900) for dark backgrounds
- **Purple** (50-900): Secondary accent
- **Gray** (50-900): Neutral, text

## CLI (Secondary)

For scripting and automation:

```bash
# Render HTML to image
hgraphic render --html "<div style='background:blue'>Hello</div>" -o output.png
hgraphic render --file template.html -o output.png --format png --size 1200x630

# Generate from template
hgraphic generate -t feature-illustration --props '{"title":"My Feature"}' -o feature.png

# List templates
hgraphic templates list

# Validate brand
hgraphic brand validate
```

### CLI Options

```bash
hgraphic render [OPTIONS]
  -i, --html <code>       HTML/CSS string
  -f, --file <path>       HTML file path
  -o, --output <path>     Output file (default: output/graphic.png)
  --format <format>       svg|png|jpg|webp (default: png)
  -s, --size <WxH>        Dimensions (default: 1200x630)
  -r, --renderer <type>   satori|puppeteer|auto (default: auto)
```

## Development

```bash
npm run dev           # Watch mode
npm run test          # Run tests
npm run lint          # Lint code
npm run typecheck     # Type validation
```

## Testing MCP Tools

```bash
npx @modelcontextprotocol/inspector node dist/mcp/server.js
```

Opens web UI at `http://localhost:6274` to test tools interactively.

## Documentation

| Doc | Purpose |
|-----|---------|
| [Walkthrough](./docs/walkthrough.md) | Usage guide |
| [Architecture](./docs/architecture.md) | System design |
| [Code Standards](./docs/code-standards.md) | Coding conventions |

## License

Internal use only.

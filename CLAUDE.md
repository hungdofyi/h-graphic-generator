# h-graphic-generator

Generate branded graphics using MCP tools.

## Graphic Generation Workflow

When asked to create a graphic:

### Step 1: Clarify Intent
Ask the user what type:
- **diagram** - Technical flows, architecture, data pipelines
- **annotation** - Screenshot highlights, feature documentation
- **marketing** - Feature showcases, promotional graphics

### Step 2: Gather Required Inputs (3-5 questions)
Based on type, ask:
- **Diagrams**: What nodes? How connected? Flow direction?
- **Annotations**: Screenshot provided? What to highlight?
- **Marketing**: Feature name? Visual focus? Dark or light?

### Step 3: Match to Recipe
Use `get_pattern("recipe:category/name")` to get composition guide:
- `recipe:diagrams/architecture-flow` or `recipe:diagrams/data-flow`
- `recipe:annotations/screenshot-highlight`
- `recipe:marketing/spotlight-feature`, `layered-showcase`, `config-preview`, `radial-network`

### Step 4: Get Components & Styles
- Call `get_style_profile` for brand tokens
- Call `get_pattern("component:category/name")` for specific styling rules
- Call `get_pattern("category")` for style library context

### Step 5: Generate & Render
- Generate HTML/CSS following recipe construction steps
- Call `render_graphic` with the HTML

**Color hierarchy:** Green is PRIMARY, Blue/Purple are SECONDARY, Navy (blue.900) for dark backgrounds.

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `get_style_profile` | Official brand guidelines (colors, typography, spacing, principles) |
| `list_patterns` | List style libraries, components, and recipes |
| `get_pattern` | Get styles, components (`component:nodes/box`), or recipes (`recipe:diagrams/architecture-flow`) |
| `list_icons` | Browse 300+ brand icons by category (chart, ds, ai, onboarding, etc.) |
| `render_graphic` | Render HTML/CSS to PNG/SVG |
| `serve_preview` | Start local server for Figma export (returns URL for capture) |
| `stop_preview` | Stop preview server when done |
| `validate_brand` | Validate brand config |

## Export to Figma

To export generated graphics as editable Figma designs:

1. **Generate HTML/CSS** as usual
2. **Start preview server** - Call `serve_preview` with the HTML
3. **Capture to Figma** - Use Figma MCP's `generate_figma_design` with the returned URL
4. **Cleanup** - Call `stop_preview` when done

**Requirements:**
- Figma Remote MCP server configured (`https://mcp.figma.com/mcp`)
- OAuth authentication with Figma

**Example workflow:**
```
User: "Create a pricing card and export to Figma"
1. Claude generates HTML/CSS for pricing card
2. Claude calls serve_preview → http://localhost:3456
3. Claude calls Figma MCP generate_figma_design with URL
4. Claude calls stop_preview
→ Result: Editable Figma layers
```

## Pattern Categories (Style Libraries)

- **marketing-graphics** - Campaign banners, mesh gradients, gradient arrows, before/after
- **landing-page** - Pricing cards, feature grids, hero sections
- **docs-diagrams** - Technical diagrams, architecture flows
- **docs-explainers** - Step-by-step explainers, code blocks, permission flows
- **docs-illustrations** - Dashboard mockups, navigation trees
- **in-app-graphics** - Data connections, dashboard publishing, data models
- **in-app-spot-illustrations** - Empty states, chart previews, document stacks

## Components (Composable System)

| Category | Components |
|----------|------------|
| nodes | box, step-indicator, connection-dot |
| connectors | elbow, straight, branch |
| containers | code-block, tooltip, frosted-card, dashboard-mockup, preview-panel |
| highlights | code-highlight, spotlight, screenshot-overlay |
| backgrounds | gradients, mesh |
| layouts | stacked-cards, layered-windows, radial-network |
| typography | docs, marketing |
| decorative | cursors, arrows, simplified-illustrations |

## Recipes (Composition Guides)

| Category | Recipes |
|----------|---------|
| diagrams | architecture-flow, data-flow |
| annotations | screenshot-highlight |
| marketing | spotlight-feature, layered-showcase, config-preview, radial-network |

Use `get_pattern("recipe:marketing/spotlight-feature")` to get full recipe.

## Brand Color Scales

```
green:  50→900 (#EAF8F2 → #145239) - PRIMARY accent
blue:   50→900 (#E8F2FD → #05264C) - Secondary, navy (900) for dark backgrounds
purple: 50→900 - Secondary accent
gray:   50→900 (#F9FBFC → #13151A) - Neutral, text
```

## Styling Approach

1. **Start with brand tokens** - Use official color scales from `get_style_profile`
2. **Apply extraction styles** - Use CSS gradients, shadows from `get_pattern`
3. **Design creatively** - Build shapes with CSS/HTML. Only use icon library for actual brand icons.
4. **Mix freely** - Combine elements from different patterns for unique results

## Asset Locations

- **Brand icons**: `brand/data/icons/` (300+ SVGs)
- **SVG templates**: `brand/svg/` (organized: connectors, arrows, diagram-icons, diagram-nodes, decorative)
- **Legacy SVGs**: `brand/extracted/svg-templates/` (still available)
- **Logos**: `brand/data/` (Logo Color.svg, Logomark variants)
- **Components**: `brand/components/` (25 JSON files)
- **Recipes**: `brand/recipes/` (7 markdown guides)
- **Workflow**: `brand/workflow/` (intake-brief, creative-guidance, output-checklist)

# h-graphic-generator

Generate branded graphics using MCP tools.

## Graphic Generation Workflow

When asked to create a graphic:

1. **Get brand tokens** - Call `get_style_profile` for official brand guidelines (colors, typography, spacing)
2. **Explore patterns** - Call `list_patterns` to discover Figma-extracted style libraries
3. **Get context styles** - Call `get_pattern` for the relevant category (can mix multiple)
4. **Generate HTML/CSS** - Design shapes creatively with CSS. Don't search icon library for every element.
5. **Render to image** - Call `render_graphic` with the HTML

**Optional:** Call `list_icons` only when you specifically need brand icons (logos, product icons). For shapes like boxes, arrows, cylinders - design with CSS.

**Important:** Use brand.json as the source of truth for color scales (green.50-900, blue.50-900, gray.50-900). Extractions show how those colors are applied in specific contexts.

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `get_style_profile` | Official brand guidelines (colors, typography, spacing, principles) |
| `list_patterns` | List style library categories from Figma extractions |
| `get_pattern` | Get detailed styles for a category (backgrounds, containers, typography, elements) |
| `list_icons` | Browse 300+ brand icons by category (chart, ds, ai, onboarding, etc.) |
| `render_graphic` | Render HTML/CSS to PNG/SVG |
| `validate_brand` | Validate brand config |

## Pattern Categories

- **marketing-graphics** - Campaign banners, mesh gradients, gradient arrows, before/after
- **landing-page** - Pricing cards, feature grids, hero sections
- **docs-diagrams** - Technical diagrams, architecture flows
- **docs-explainers** - Step-by-step explainers, code blocks, permission flows
- **docs-illustrations** - Dashboard mockups, navigation trees
- **in-app-graphics** - Data connections, dashboard publishing, data models
- **in-app-spot-illustrations** - Empty states, chart previews, document stacks

## Brand Color Scales

```
green: 50→900 (#EAF8F2 → #145239) - Primary accent
blue:  50→900 (#E8F2FD → #05264C) - Secondary, backgrounds
gray:  50→900 (#F9FBFC → #13151A) - Neutral, text
```

## Styling Approach

1. **Start with brand tokens** - Use official color scales from `get_style_profile`
2. **Apply extraction styles** - Use CSS gradients, shadows from `get_pattern`
3. **Design creatively** - Build shapes with CSS/HTML. Only use icon library for actual brand icons.
4. **Mix freely** - Combine elements from different patterns for unique results

## Asset Locations

- **Brand icons**: `brand/data/icons/` (300+ SVGs)
- **SVG templates**: `brand/extracted/svg-templates/` (charts, arrows, connectors)
- **Logos**: `brand/data/` (Logo Color.svg, Logomark variants)

# h-graphic-generator

Generate branded graphics using MCP tools.

## CRITICAL RULES (Read First!)

### Typography
- **Sentence case ONLY** - NEVER use ALL CAPS or `text-transform: uppercase`
- Exception: Acronyms (API, SQL, APAC) are proper nouns

### What NOT to Add
- **No browser chrome** - Don't add macOS window dots (red/yellow/green), title bars, or fake browser UI
- **No OS emojis** - Use brand icons from `brand/data/icons/` or CSS shapes
- **No decorative elements** not specified in the brand system

### Pre-render Checklist
- [ ] Sentence case only (no ALL CAPS)
- [ ] No browser chrome or fake window UI
- [ ] Height calculated and fits canvas
- [ ] Bottom padding ≥ 32px
- [ ] No negative positioning on badges
- [ ] Colors use brand tokens
- [ ] **Cursors use brand SVG** - `get_pattern("component:decorative/cursors")` returns `svgContent`
- [ ] **Icons from brand library** - Call `list_icons` first, embed from `brand/data/icons/`
- [ ] **SVG viewBox has padding** - No elements at 0 or max edges

---

## Graphic Generation Workflow

When asked to create a graphic:

### When to Ask Questions vs Proceed Directly

| User Prompt Style | Action |
|-------------------|--------|
| Minimal ("Create a diagram for X") | **Ask 3-5 clarifying questions** |
| Moderate ("Diagram showing A→B→C, 1200x630") | **Ask 1-2 style questions** (background, recipe preference) |
| Fully specified (dimensions, colors, all content, output path) | **Proceed but still load recipe** for best practices |

**Even with detailed prompts, ALWAYS:**
1. Load the appropriate recipe via `get_pattern("recipe:...")`
2. Follow recipe construction steps and layout safety rules
3. Use brand tokens from `get_style_profile`

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
- **Calculate layout first** - Sum all sections to verify content fits canvas
- Generate HTML/CSS following recipe construction steps AND layout safety rules
- Call `render_graphic` with the HTML

**Color hierarchy:** Green is PRIMARY, Blue/Purple are SECONDARY, Navy (blue.900) for dark backgrounds.

## Layout Safety Rules (MANDATORY)

Before writing HTML/CSS, you MUST verify:

### Height Calculation
```
Canvas height: [X]px
- Top padding:     32-48px
- Header/title:    ~80-100px
- Main content:    ~[calculate]px
- Footer/labels:   ~50-60px
- Bottom padding:  32-48px (MINIMUM)
─────────────────────────────
Total MUST be ≤ canvas height
```

### Positioning Rules
| DO | DON'T |
|----|-------|
| `transform: translateY(-50%)` | `top: -12px` (clips outside parent) |
| Explicit pixel heights | `flex: 1` for critical sections |
| `margin-top` on parent for badge space | Negative offsets on badges |
| Consistent panel heights in rows | Mixed heights causing misalignment |

### Common Mistakes to Avoid
- Content touching canvas edge (no bottom padding)
- Badges/labels clipping outside container bounds
- Using `flex: 1` causing unpredictable heights
- Not accounting for absolute-positioned elements in height calc

## SVG Asset Rules (CRITICAL)

### ALWAYS Fetch Brand Assets First

| Element | Fetch With | Never Do |
|---------|------------|----------|
| Cursor/pointer | `get_pattern("component:decorative/cursors")` → use `svgContent` | CSS tricks like `border-radius: 0 50% 50% 50%` |
| Icons | `list_icons` → embed from `brand/data/icons/` | Generate tiny inline SVGs |
| Arrows | `get_pattern("component:decorative/arrows")` | Hand-draw SVG paths |
| Chart icons | `list_icons("chart")` → `brand/data/icons/chart/*.svg` | Draw charts from scratch |

### SVG Rendering Rules

| Rule | Good | Bad |
|------|------|-----|
| ViewBox padding | Elements at 10-290 in 300px viewBox | Elements at 0 or 300 (clips) |
| Icon size | ≥16px (prefer 20px+) | 12px or smaller |
| Small icons | Use `fill` | Use `stroke` (renders poorly) |
| Curves | Points on actual visual path | Points at Bezier control points |

### Example: Embedding Cursor

```html
<!-- 1. Call get_pattern("component:decorative/cursors") -->
<!-- 2. Response includes svgContent with CSS variables -->
<!-- 3. Embed with customization: -->
<div style="width: 40px; height: 40px; --fill-0: #9250E5; --stroke-0: white;">
  <svg viewBox="0 0 98.5 98.7" fill="none">
    <path d="M26.75 30.78..." fill="var(--fill-0, #9250E5)" stroke="var(--stroke-0, white)"/>
  </svg>
</div>
```

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `create_graphic` | **RECOMMENDED** Start here - uses interactive forms for step-by-step input |
| `get_style_profile` | Official brand guidelines (colors, typography, spacing, principles) |
| `list_patterns` | List style libraries, components, and recipes |
| `get_pattern` | Get styles, components (`component:nodes/box`), or recipes (`recipe:diagrams/architecture-flow`) |
| `list_icons` | Browse 300+ brand icons by category (chart, ds, ai, onboarding, etc.) |
| `render_graphic` | Render HTML/CSS to PNG/SVG (use after gathering requirements) |
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

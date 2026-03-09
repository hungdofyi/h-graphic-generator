# Composable Graphic System Design

**Date:** 2026-03-09
**Status:** COMPLETE

## Problem Statement

Current extraction approach is mass-scan oriented, producing shallow style references. Real-world needs include:
- Complex diagrams (curved paths, branching, grouping, dashed lines)
- UI annotations (screenshot + highlight + callouts)
- Image-as-reference workflow (sketch → polished diagram)
- Marketing graphics with creative flexibility

## Design Decision

**Approach B: Composable Component System** selected over:
- A) Enhanced Pattern Library (too shallow)
- C) Template-Based Generation (too rigid)

## Architecture

```
brand/
├── brand.json                    # Source of truth (unchanged)
├── components/                   # Styling rules (HOW things look)
│   ├── nodes/
│   ├── connectors/
│   ├── annotations/
│   ├── highlights/
│   ├── backgrounds/
│   ├── containers/
│   ├── layouts/
│   ├── decorative/
│   └── typography/
├── svg/                          # Pre-made SVGs (AI embeds, doesn't generate)
│   ├── connectors/
│   ├── arrows/
│   ├── diagram-icons/
│   ├── diagram-nodes/
│   └── decorative/
├── recipes/                      # Composition guidance
│   ├── diagrams/
│   ├── annotations/
│   └── marketing/
├── workflow/                     # AI guidance
│   ├── intake-brief.md
│   ├── reference-analysis.md
│   ├── creative-guidance.md
│   └── output-checklist.md
├── extracted/                    # Keep for backward compat
└── data/                         # Existing logos, icons (unchanged)
```

## Key Principles

### Components = Styling Rules, NOT Content Templates

| Layer | What | Who Decides |
|-------|------|-------------|
| Creative concept | Visual metaphor, composition | AI + context |
| Style application | Colors, fonts, effects | Components |
| Brand guardrails | What to avoid, color ratios | brand.json |

### Tiered SVG Approach

| Complexity | Approach | Example |
|------------|----------|---------|
| Simple | AI generates | Rectangles, circles, straight lines |
| Medium | AI uses reference SVG | Curved arrows, elbow connectors |
| Complex | AI embeds pre-made SVG | Decorative shapes, complex charts |

### Structured Intake Workflow

1. Declare intent (diagram/annotation/marketing)
2. Required inputs (3-5 questions)
3. Pattern match to recipes
4. Propose structure, confirm with user
5. Generate with brand styling

---

## Phase 1: Diagrams (COMPLETE)

### Connectors to Extract (SVG)

| Element | File | Priority | Source Frame |
|---------|------|----------|--------------|
| Elbow down-right | `svg/connectors/elbow-down-right.svg` | High | 1:1270 |
| Elbow right-down | `svg/connectors/elbow-right-down.svg` | High | 1:1270 |
| Elbow up-left | `svg/connectors/elbow-up-left.svg` | High | 1:1270 |
| Elbow with arrow | `svg/connectors/elbow-arrow.svg` | High | 1:1340 |
| Branching (1-to-many) | `svg/connectors/branch-1-to-3.svg` | High | 1:1340 |
| Straight horizontal arrow | `svg/connectors/straight-h-arrow.svg` | Medium | 1:1270 |
| Straight vertical arrow | `svg/connectors/straight-v-arrow.svg` | Medium | 1:1192 |
| Dashed horizontal | `svg/connectors/dashed-h.svg` | Medium | FigJam 5:224 |
| Dashed with arrow | `svg/connectors/dashed-arrow.svg` | Medium | FigJam 5:224 |

### Diagram Icons to Extract (SVG)

| Element | File | Priority | Note |
|---------|------|----------|------|
| User avatar large | `svg/diagram-icons/user-avatar.svg` | High | With label badge slot |
| User avatar labeled | `svg/diagram-icons/user-avatar-labeled.svg` | High | A/B/C badges |
| Database cylinder | `svg/diagram-icons/database.svg` | High | May already have |
| Brain/AI | `svg/diagram-icons/brain-ai.svg` | High | New |
| SQL document | `svg/diagram-icons/sql-document.svg` | Medium | New |
| Bar chart | `svg/diagram-icons/chart-bar.svg` | Medium | Check existing |
| Line chart | `svg/diagram-icons/chart-line.svg` | Medium | Check existing |
| Pie chart | `svg/diagram-icons/chart-pie.svg` | Medium | Check existing |

### Node Component Variants

```json
// components/nodes/box.json
{
  "name": "box",
  "variants": {
    "default": {
      "background": "white",
      "border": "gray.400",
      "borderWidth": 1.5,
      "borderRadius": 8
    },
    "semantic": {
      "background": "green.50",
      "border": "green.600",
      "borderWidth": 1.5,
      "borderRadius": 7.2
    },
    "ai-container": {
      "background": "blue.50",
      "border": "blue.800",
      "borderWidth": 2,
      "borderStyle": "dashed",
      "borderRadius": 11
    },
    "gray-fill": {
      "background": "gray.200",
      "border": "none",
      "borderRadius": 11
    }
  }
}
```

### Step Indicator Variants

```json
// components/nodes/step-indicator.json
{
  "name": "step-indicator",
  "variants": {
    "gray": {
      "background": "gray.200",
      "textColor": "gray.800",
      "size": 37
    },
    "green": {
      "background": "green.100",
      "textColor": "gray.800",
      "size": 37
    }
  },
  "typography": {
    "font": "Inter",
    "weight": "600",
    "size": 22
  }
}
```

### Connector Component

```json
// components/connectors/elbow.json
{
  "name": "elbow-connector",
  "implementation": {
    "type": "svg-reference",
    "files": {
      "down-right": "svg/connectors/elbow-down-right.svg",
      "right-down": "svg/connectors/elbow-right-down.svg",
      "up-left": "svg/connectors/elbow-up-left.svg"
    }
  },
  "variants": {
    "default": { "stroke": "gray.600", "strokeWidth": 1.5 },
    "green": { "stroke": "green.600", "strokeWidth": 1.5 },
    "dashed": { "stroke": "gray.600", "strokeWidth": 1.5, "strokeDasharray": "6 4" }
  },
  "arrowHead": {
    "type": "triangle",
    "size": 8,
    "fill": "currentColor"
  }
}
```

### Connection Dot Component

```json
// components/nodes/connection-dot.json
{
  "name": "connection-dot",
  "variants": {
    "gray": { "fill": "gray.600", "size": 20 },
    "green": { "fill": "green.600", "size": 20 }
  }
}
```

### Code Block Container

```json
// components/containers/code-block.json
{
  "name": "code-block",
  "structure": {
    "container": {
      "background": "white",
      "border": "gray.400",
      "borderWidth": 1.5,
      "borderRadius": 8
    },
    "titleBar": {
      "background": "blue.50",
      "borderRadius": "7.5px 7.5px 0 0",
      "height": 62
    }
  },
  "syntaxColors": {
    "keyword": "green.500",
    "identifier": "blue.600",
    "sqlKeyword": "blue.800",
    "default": "gray.900"
  }
}
```

### Diagram Recipe Example

```markdown
# recipes/diagrams/architecture-flow.md

## When to Use
- Service/system connections
- API relationships
- Data flow between components

## Required Inputs
- Nodes (name, type, icon?)
- Connections (from → to, label?)
- Grouping? (which belong together)

## Components Used
| Element | Component | SVG |
|---------|-----------|-----|
| Service box | nodes/box (default) | - |
| Database | nodes/box | svg/diagram-icons/database.svg |
| Connection | connectors/elbow | svg/connectors/elbow-*.svg |
| Step indicator | nodes/step-indicator | - |
| Connection dot | nodes/connection-dot | - |

## Construction Steps
1. Layout direction (LTR, TTB, custom)
2. Place nodes (min 80px spacing)
3. Route connections (prefer elbow)
4. Add step indicators if needed
5. Apply labels (Inter 500, gray.800)
6. Set background (white for docs)

## Text-on-Line Pattern
- Position labels beside connectors, not breaking them
- Use gray.700 for annotation text
- Step numbers in circles along the path
```

---

## Phase 2: UI Annotations (COMPLETE)

Migrated to:
- `components/highlights/spotlight.json` - Circle spotlight, row highlight
- `components/highlights/screenshot-overlay.json` - Focus panels, masks, cursors
- `recipes/annotations/screenshot-highlight.md` - Composition guide

## Phase 3: Marketing Graphics (COMPLETE)

Migrated to:
- `components/layouts/stacked-cards.json` - Dashboard tab stacking
- `components/layouts/layered-windows.json` - Multi-window depth
- `components/layouts/radial-network.json` - Hub with satellites
- `components/backgrounds/mesh.json` - Mesh gradients with blur
- `components/containers/preview-panel.json` - Config-to-preview mapping
- `recipes/marketing/spotlight-feature.md`
- `recipes/marketing/layered-showcase.md`
- `recipes/marketing/config-preview.md`
- `recipes/marketing/radial-network.md`

---

## Figma Source References

| Frame | Node ID | Content |
|-------|---------|---------|
| Other BI tools | 1:1270 | Elbow connectors, step indicators |
| Holistics Semantic Layer | 1:1340 | Green connectors, branching |
| diagram AI | 1:1192 | Dashed container, code blocks, brain icon |
| Embed Pricing by Query | 1:1721 | Complex arrow flow, user icons |
| FigJam Shapes | 5:224 | Node variants, dashed arrows |
| FigJam Backgrounds | 5:223 | Gradient backgrounds |

---

## MCP Tool Changes

Expand existing tools rather than adding new ones:

```
get_pattern("diagrams/architecture") returns:
{
  "type": "recipe",
  "recipe": { /* from recipes */ },
  "components": [ /* referenced */ ],
  "svgs": [ /* paths */ ]
}
```

---

## Completed

1. ✓ Extract SVG connectors from Figma frames (34 SVGs in `brand/svg/`)
2. ✓ Extract diagram icons
3. ✓ Create component JSON files (25 components in 9 categories)
4. ✓ Create diagram recipes (7 recipes in 3 categories)
5. ✓ Create workflow guides (3 files)
6. ✓ Update MCP tools (`list_patterns`, `get_pattern` support components/recipes)
7. ✓ Phase 2: UI Annotations
8. ✓ Phase 3: Marketing Graphics

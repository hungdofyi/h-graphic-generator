# h-graphic MCP Server Architecture Review

**Date:** 2026-03-10
**Reviewer:** code-reviewer
**Focus:** Data flow, asset resolution, recipe/component usability

---

## Architecture Diagram (Data Flow)

```
                           USER REQUEST
                                 |
                                 v
                    +------------------------+
                    |   SERVER INSTRUCTIONS   |
                    |  (SERVER_INSTRUCTIONS)  |
                    |   ~100 lines guidance   |
                    +------------------------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
+----------------+    +------------------+    +------------------+
| get_style_     |    | list_patterns    |    | get_pattern      |
| profile        |    | list_icons       |    | (components/     |
|                |    |                  |    |  recipes/styles) |
+----------------+    +------------------+    +------------------+
         |                       |                       |
         v                       v                       v
+----------------+    +------------------+    +------------------+
| brand.json     |    | Directory scan   |    | ComponentLoader  |
| (colors,typo)  |    | brand/data/icons |    | ExtractionLoader |
+----------------+    +------------------+    +------------------+
         |                       |                       |
         +----------+------------+----------+------------+
                    |                       |
                    v                       v
         +-------------------+    +-------------------+
         | JSON response     |    | JSON + markdown   |
         | (flat colors,     |    | (recipe.content)  |
         |  no SVG content)  |    | (component JSON)  |
         +-------------------+    +-------------------+
                    |                       |
                    +----------+------------+
                               |
                               v
                    +------------------------+
                    |    CLAUDE GENERATES    |
                    |      HTML/CSS          |
                    | (must synthesize from  |
                    |  multiple responses)   |
                    +------------------------+
                               |
                               v
                    +------------------------+
                    |    render_graphic      |
                    | (Puppeteer/Satori)     |
                    +------------------------+
                               |
                               v
                         PNG/SVG OUTPUT
```

---

## Systematic Issues Table

| # | Issue | Impact | Root Cause |
|---|-------|--------|------------|
| **1** | **list_icons returns paths, not content** | Claude must guess how to embed; often invents broken SVGs | Tool returns `basePath` + icon names but no actual SVG markup |
| **2** | **Recipe SVG references are stale/wrong** | Recipe says `svg/diagram-icons/database.svg`, actual file is `icon-data-warehouse.svg` | Recipe markdown written manually, never validated against actual SVG files |
| **3** | **Component JSON lacks embedding examples** | Claude sees variant properties but no ready-to-use HTML snippets | Components describe parameters abstractly, not concrete CSS |
| **4** | **Color tokens buried in nested JSON** | `get_style_profile` returns 460+ line JSON; color scales at lines 26-74 | No flattened "ready-to-use CSS variables" output |
| **5** | **No SVG content in component responses** | `getComponentWithSvg` only works if `svgTemplate` field matches exactly | Most components lack `svgTemplate` or have wrong paths |
| **6** | **Recipe construction steps are prose, not code** | "Place nodes (min 80px spacing)" - no CSS flex/grid snippet | Human-readable but not machine-executable |
| **7** | **Style libraries have CSS strings, not classes** | `"css": "box-shadow: 0 4px 16px..."` requires extraction | No `.shadow-elevated { ... }` utility class generation |
| **8** | **Icon library has 300+ icons, no semantic grouping** | "database" icon doesn't exist; must guess `icon-data-warehouse` | File naming follows no discoverable convention |
| **9** | **get_pattern returns different structures** | Components, recipes, styleLibraries have completely different shapes | Claude must handle 3+ response formats |
| **10** | **No asset embedding endpoint** | To use an SVG, Claude must either guess path or make multiple calls | No `get_svg_content(path)` tool |

---

## Critical Flow Analysis

### What Claude Actually Receives

**From `get_style_profile`:**
```json
{
  "creativeGuidance": { ... },  // ~60 lines of rules
  "brand": "Holistics",
  "colors": {
    "primary": { "value": "#05264C" },
    "scales": {
      "green": { "50": "#EAF8F2", "100": "#CCEDE0", ... }
    }
  }
  // Total: ~200+ lines JSON
}
```
**Problem:** Claude must manually extract `#EAF8F2` from `colors.scales.green.50`.

**From `get_pattern("recipe:diagrams/architecture-flow")`:**
```json
{
  "type": "recipe",
  "name": "architecture-flow",
  "content": "# Architecture Flow Diagram\n\n## Components Used\n\n| Element | Component | SVG |\n|---------|-----------|-----|\n| Database | nodes/box | svg/diagram-icons/database.svg |\n..."
}
```
**Problem:** The markdown table references `database.svg` which DOES NOT EXIST. Actual file is `icon-data-warehouse.svg`.

**From `get_pattern("component:decorative/cursors")`:**
```json
{
  "type": "component",
  "name": "cursors",
  "variants": {
    "pointer-white": { "type": "polygon", "color": "white" },
    "figma-cursor": { "size": 125, "fill": "white" }
  },
  "svgTemplate": "svg/decorative/cursor.svg",
  "svgContent": "<svg viewBox=\"0 0 98.5 98.7\" ...>...</svg>",
  "svgUsage": {
    "instruction": "Embed this SVG directly in your HTML.",
    "cssVariables": ["--fill-0", "--stroke-0"]
  }
}
```
**This one works!** But only because `cursor.json` has correct `svgTemplate` path.

**From `list_icons`:**
```json
{
  "categories": [{ "name": "chart", "count": 50 }],
  "totalIcons": 300,
  "icons": ["chart/bar-chart", "chart/line", ...],
  "basePath": "brand/data/icons",
  "usage": { "path": "Use icon names with .svg extension" }
}
```
**Problem:** Returns discovery info but NO actual SVG content. Claude must guess how to fetch/embed.

---

## Why Claude Produces Broken Output

### Symptom: "Shield" shape instead of database cylinder

**Flow:**
1. Claude asks for recipe: `get_pattern("recipe:diagrams/architecture-flow")`
2. Recipe says: `svg/diagram-icons/database.svg`
3. File doesn't exist (actual: `icon-data-warehouse.svg`)
4. Claude has no `get_svg_content` tool
5. Claude invents a CSS shape that looks like a shield

**Root causes:**
- Recipe markdown manually written, never validated
- No tool to fetch arbitrary SVG by path
- Claude falls back to CSS tricks when SVG unavailable

### Symptom: Output uses no brand colors (all gray)

**Flow:**
1. Claude calls `get_style_profile`
2. Receives 200+ lines of nested JSON
3. Color scales buried at `colors.scales.green.50`
4. Claude either ignores or uses wrong extraction path
5. Falls back to CSS defaults (grays)

**Root causes:**
- No pre-generated CSS custom properties
- No utility classes like `.bg-green-50`
- Too much data, unclear which colors to use

---

## Priority Recommendations

### P0 (Critical - Blocks Success)

| Fix | Implementation | Effort |
|-----|----------------|--------|
| **Add `get_svg` tool** | New tool that takes path, returns raw SVG content | 1h |
| **Validate recipe SVG refs** | CI script to check all recipe markdown SVG paths exist | 2h |
| **list_icons returns content** | Option to include SVG markup for requested icons | 1h |

### P1 (High - Major Friction)

| Fix | Implementation | Effort |
|-----|----------------|--------|
| **Generate CSS variables** | `get_style_profile` returns `--green-50: #EAF8F2;` block | 2h |
| **Recipe code snippets** | Add `<details><summary>CSS</summary>` with actual flex code | 4h |
| **Component HTML examples** | Each variant gets ready-to-copy HTML snippet | 3h |

### P2 (Medium - Improvements)

| Fix | Implementation | Effort |
|-----|----------------|--------|
| **Semantic icon aliases** | `database` -> `icon-data-warehouse.svg` mapping | 2h |
| **Unified response format** | All `get_pattern` responses share common shape | 4h |
| **Utility class injection** | `style_profile` param generates `.shadow-elevated` etc | 3h |

---

## Anti-Patterns to Remove

### 1. Path References Without Content
**Current:**
```json
"svgTemplate": "svg/decorative/cursor.svg"
```
**Should be:**
```json
"svgTemplate": "svg/decorative/cursor.svg",
"svgContent": "<svg>...</svg>"  // Always inline
```

### 2. Prose Instructions
**Current:**
```markdown
## Construction Steps
1. Place nodes (min 80px spacing)
```
**Should be:**
```markdown
## Construction Steps
1. Place nodes (min 80px spacing)
   ```css
   .node-container { display: flex; gap: 80px; }
   ```
```

### 3. Multiple Calls for Single Asset
**Current flow:**
1. `list_icons` -> find "database"
2. Can't find it
3. Guess path or invent SVG

**Should be:**
1. `get_icon("database")` -> returns SVG content directly
   (with fuzzy matching: "database" -> "icon-data-warehouse")

### 4. Nested Color Access
**Current:**
```javascript
colors.scales.green["50"]  // Requires 3-level access
```
**Should also return:**
```css
:root {
  --green-50: #EAF8F2;
  --green-100: #CCEDE0;
  /* ... */
}
```

---

## Specific File Issues

### `/brand/recipes/diagrams/architecture-flow.md`
**Line 21:** References `svg/diagram-icons/database.svg`
**Reality:** File is `svg/diagram-icons/icon-data-warehouse.svg`

### `/src/mcp/tools/list-icons.ts`
**Line 102-121:** Returns icon names and basePath
**Missing:** Option to return actual SVG content

### `/brand/components/decorative/cursors.json`
**Working:** Has `svgTemplate` that matches real file
**Issue:** Other components (nodes/box.json) lack `svgTemplate`

### `/src/mcp/tools/get-pattern.ts`
**Line 91:** `getComponentWithSvg` called
**Issue:** Only works if `svgTemplate` path is correct and file exists

---

## Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Components with valid svgTemplate | ~5/25 (20%) | 100% |
| Recipe SVG refs that resolve | Unknown | 100% |
| Icon semantic aliases | 0 | 50+ common terms |
| Tools that return ready-to-embed content | 1 (cursors only) | All |

---

## Unresolved Questions

1. Should `list_icons` batch-return SVG content, or create separate `get_icon` tool?
2. How to handle recipe versioning if SVG files move?
3. Should components define CSS classes or inline styles?
4. Is Satori renderer needed anymore if Puppeteer handles everything?

---

## Summary

The architecture has a solid foundation but suffers from a **content delivery gap**: tools return metadata and paths but not actual embeddable content. Claude must make multiple calls and often fails to resolve assets, leading to invented CSS shapes and missing brand colors.

**The single highest-impact fix:** Add a `get_svg(path)` tool that returns raw SVG content, and update all recipes/components to use validated paths.

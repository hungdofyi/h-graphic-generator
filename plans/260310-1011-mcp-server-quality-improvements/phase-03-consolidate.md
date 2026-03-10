# Phase 3: Consolidate & Simplify

**Status:** Not Started
**Effort:** 4 hours
**Priority:** P2
**Can run parallel to:** Phase 2

---

## Overview

Consolidate the fragmented extraction system:
1. **Merge v1 + v2 schemas** into single format (ExtractionLoader loads ALL)
2. **Merge svg-templates (63 SVGs) → brand/svg (34 SVGs)**
3. Add HTML/CSS snippets to components
4. Remove graphic_intake prompt
5. Update SERVER_INSTRUCTIONS with gradients + shape guidance

**Problem:** Most recent extractions (Mar 9) use v1 schema but ExtractionLoader only loads v2. This is backwards - we're ignoring the newest content.

---

## Task 3.1: Unify Extraction Schema (v1 → v2)

**Problem:** ExtractionLoader only loads `*-styles.json` with v2 schema, but newest extractions (Mar 9) use v1 schema.

**Current state:**
- 7 v2 files (`*-styles.json`) - LOADED
- 14 v1 files - IGNORED (but some have newest content!)

**Fix:** Update ExtractionLoader to load ALL extraction files, not just `-styles.json`.

**File:** `src/core/extraction-loader.ts`

```typescript
// CHANGE line 40-42:
// FROM:
const jsonFiles = entries.filter(
  e => e.isFile() && e.name.endsWith('-styles.json')
);

// TO:
const jsonFiles = entries.filter(
  e => e.isFile() && e.name.endsWith('.json')
);

// CHANGE line 49-50:
// FROM:
if (data.$schema !== 'h-graphic-styles-v2') continue;

// TO:
if (!data.$schema?.startsWith('h-graphic')) continue;
```

**Then migrate schema:** Update all v1 files to v2 schema structure (or vice versa - pick one).

---

## Task 3.2: Merge SVG Folders

**Current state:**
- `brand/svg/` - 34 SVGs (11 unique)
- `brand/extracted/svg-templates/` - 63 SVGs (40 unique, 23 duplicates)

**Action plan:**

1. **Move 40 unique SVGs** from svg-templates → brand/svg:
   ```bash
   # Categorize into existing brand/svg subfolders:
   # - ai-character-*.svg → brand/svg/decorative/
   # - explainer-*.svg → brand/svg/diagram-nodes/ or arrows/
   # - chart icons → brand/svg/diagram-icons/
   ```

2. **Delete 23 duplicates** (already in brand/svg, content identical)

3. **Delete svg-templates folder** after migration

4. **Update references** in extraction JSON files:
   ```
   "svg-templates/icon-data-warehouse.svg"
   → "brand/svg/diagram-icons/icon-data-warehouse.svg"
   ```

5. **Update list-patterns.ts** line 59:
   ```typescript
   // REMOVE or update:
   svgBasePath: 'brand/extracted/svg-templates/',
   // TO:
   svgBasePath: 'brand/svg/',
   ```

---

## Task 3.2: Add CSS Snippets to Components

**Goal:** Components return ready-to-copy CSS, not abstract properties

**File:** `brand/components/nodes/box.json`

**Current:**
```json
"default": {
  "background": "white",
  "border": "gray.400",
  "borderWidth": 1.5,
  "borderRadius": 8
}
```

**Enhanced:**
```json
"default": {
  "background": "white",
  "border": "gray.400",
  "borderWidth": 1.5,
  "borderRadius": 8,
  "css": "background: white; border: 1.5px solid #CBD0D7; border-radius: 8px;",
  "html": "<div style=\"background: white; border: 1.5px solid #CBD0D7; border-radius: 8px; padding: 16px;\">{{content}}</div>"
}
```

**Apply to all components:**
- `nodes/box.json` (6 variants)
- `nodes/step-indicator.json`
- `nodes/connection-dot.json`
- `connectors/elbow.json`
- `connectors/straight.json`
- `containers/code-block.json`
- `containers/frosted-card.json`

**Automation script:** (optional)
```typescript
// scripts/add-css-snippets.ts
// Read component JSON, resolve color tokens, generate CSS string
```

---

## Task 3.3: Remove graphic_intake Prompt

**File:** `src/mcp/server.ts`

**Remove lines 116-154 (INTAKE_WORKFLOW_CONTENT) and 165-191 (prompt registration):**
```typescript
// DELETE: INTAKE_WORKFLOW_CONTENT constant
// DELETE: server.registerPrompt('graphic_intake', ...)
```

**Why:** Prompts rarely invoked by Claude; guidance in SERVER_INSTRUCTIONS is sufficient.

---

## Task 3.4: Add Shape Guidance to SERVER_INSTRUCTIONS

**File:** `src/mcp/server.ts`

**Add after color reference:**
```typescript
## Common Shape Mistakes

### Database/Cylinder
WRONG: CSS shield shape, rounded rectangle
RIGHT: Use get_icon("database") for proper 3D cylinder SVG

### Cursor/Pointer
WRONG: CSS triangle with border-radius tricks
RIGHT: Use get_icon("cursor") for brand cursor SVG

### Bar Charts
WRONG: Inline stroke SVGs, random colors
RIGHT: Simple CSS rectangles with brand colors:
\`\`\`css
.bar { background: #259B6C; border-radius: 4px; }
\`\`\`

### Arrows/Connectors
WRONG: Text arrows (→, >, ➜)
RIGHT: CSS-drawn or get_icon("arrow-right"):
\`\`\`html
<div style="display:flex;align-items:center;">
  <div style="width:40px;height:2px;background:#8f99a3;"></div>
  <div style="border:6px solid transparent;border-left:8px solid #8f99a3;"></div>
</div>
\`\`\`
```

---

## Task 3.5: Update CLAUDE.md with Tool Reduction

**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/CLAUDE.md`

**Update "Available MCP Tools" table:**
```markdown
| Tool | Purpose |
|------|---------|
| `get_style_profile` | Brand guidelines (colors, typography, spacing) |
| `get_icon` | **NEW** Get SVG content for icons (database, cursor, etc.) |
| `list_icons` | Browse 300+ brand icons by category |
| `list_patterns` | List style libraries, components, recipes |
| `get_pattern` | Get styles, components, or recipes |
| `render_graphic` | Render HTML/CSS to PNG/SVG |
| `serve_preview` / `stop_preview` | Preview server for Figma export |
| `validate_brand` | Validate brand config |
```

**Remove references to:**
- `create_graphic`
- Template system

---

## Validation

1. Build: `npm run build`
2. Test: `npm run test`
3. Count extraction files: Should be 4 or fewer
4. Test component CSS: Call `get_pattern("component:nodes/box")`, verify `css` field present
5. Full integration test: Generate data-flow diagram with reference image

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Extraction files | 22 | 4 |
| Tools | 10 | 8 |
| Component variants with CSS | 0 | 25+ |
| Lines in SERVER_INSTRUCTIONS | 102 | ~130 (more useful) |

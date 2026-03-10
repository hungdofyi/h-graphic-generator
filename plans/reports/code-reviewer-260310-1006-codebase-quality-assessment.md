# Comprehensive Codebase Review: h-graphic-generator

**Date:** 2026-03-10
**Reviewer:** code-reviewer
**Scope:** Full codebase review for output quality assessment

---

## Executive Summary

The codebase is **well-architected** but suffers from **complexity fragmentation** - too many systems (extractions, components, recipes, templates) with overlapping responsibilities that confuse Claude. The rendering pipeline is solid; the issue is **guidance delivery**.

**Root Cause of Poor Output:** Claude receives overwhelming, sometimes conflicting guidance spread across:
- CLAUDE.md (project root)
- SERVER_INSTRUCTIONS (server.ts)
- brand.json (brand guidelines)
- Style libraries (22 JSON files)
- Components (25 JSON files)
- Recipes (7 markdown files)
- Tool descriptions (inline in each tool)

Claude doesn't know which to prioritize, resulting in defaults/gray colors and wrong shapes.

---

## 1. Architecture Diagram

```
                    USER REQUEST
                         |
                         v
    +--------------------------------------------+
    |              MCP SERVER (server.ts)        |
    |  - SERVER_INSTRUCTIONS (102 lines)         |
    |  - WORKFLOW_GUIDANCE (6 lines)             |
    |  - INTAKE_WORKFLOW_CONTENT (40 lines)      |
    +--------------------------------------------+
                         |
         +---------------+---------------+
         v               v               v
    +---------+   +-----------+   +-------------+
    |TEMPLATES|   |   TOOLS   |   |  RESOURCES  |
    | (4 only)|   | (10 total)|   | (brand.json)|
    +---------+   +-----------+   +-------------+
                         |
    +--------------------+--------------------+
    v                    v                    v
+------------+   +---------------+   +--------------+
|BRAND SYSTEM|   |EXTRACTION SYS|   |COMPONENT SYS |
|brand.json  |   |22 JSON files |   |25 JSON + 7 MD|
|brand-ctx   |   |extraction-ldr|   |component-ldr |
+------------+   +---------------+   +--------------+
                         |
                         v
    +--------------------------------------------+
    |           RENDERING PIPELINE               |
    |  1. HTML/CSS (from Claude)                 |
    |  2. Engine (Satori) OR PuppeteerRenderer   |
    |  3. ExportPipeline (resvg/sharp)           |
    |  4. Output file (PNG/SVG/JPG/WebP)         |
    +--------------------------------------------+
```

### Rendering Flow

1. **Input:** Claude generates raw HTML/CSS string
2. **Renderer Selection:**
   - `Engine.needsPuppeteer()` checks for gradients, shadows, grid, transforms
   - Simple CSS -> Satori (HTML to SVG, fast but limited)
   - Complex CSS -> Puppeteer (full browser, slower but accurate)
3. **Font Loading:** `font-loader.ts` loads Inter, Inter Display, JetBrains Mono (TTF files exist and are correct)
4. **Export:** `ExportPipeline` uses resvg-js + sharp for format conversion
5. **Output:** File written to disk

---

## 2. Systematic Issues Table

| # | Area | Issue | Severity | Impact | Root Cause |
|---|------|-------|----------|--------|------------|
| 1 | Guidance | Too many sources of truth | Critical | Claude ignores brand colors | 4 overlapping systems |
| 2 | Guidance | SERVER_INSTRUCTIONS buried | High | Claude starts with defaults | No clear "read this first" |
| 3 | Components | `getComponentWithSvg` fetches but Claude must know to use it | High | Cursors drawn as CSS shapes | Implicit dependency |
| 4 | Extraction | v1 vs v2 schema files mixed in extracted/ | Medium | Loader ignores v1 files | Migration incomplete |
| 5 | Templates | Only 4 templates, barely used | Medium | Wasted code | Feature abandoned |
| 6 | Tools | `create_graphic` returns JSON instructions, not UI | Medium | Extra tool call overhead | MCP doesn't support forms |
| 7 | CSS Injection | `style_profile` param injects utility classes | Low | Rarely used, adds complexity | YAGNI violation |
| 8 | Recipes | Markdown returned raw, not parsed | Low | Claude must parse manually | Could be structured JSON |
| 9 | Icons | `list_icons` returns paths but no way to embed | Medium | Claude invents inline SVGs | Missing `get_icon` tool |
| 10 | Rendering | Puppeteer launches new browser per render | Low | Slow for batch | Could reuse browser |

---

## 3. YAGNI Violations (Over-engineering)

### Should REMOVE

| Item | Location | Reason |
|------|----------|--------|
| `create_graphic` tool | src/mcp/tools/create-graphic.ts | Workflow guidance better in SERVER_INSTRUCTIONS; this tool adds confusion |
| `style_profile` param in render_graphic | src/mcp/tools/render-graphic.ts | CSS injection rarely used, Claude better writes inline styles |
| Legacy v1 extraction files | brand/extracted/*.json (non -styles.json) | 8 files that `ExtractionLoader` ignores |
| `generate_from_template` tool | src/mcp/tools/generate-from-template.ts | Only 4 templates, rarely used, adds complexity |
| `list_templates` tool | src/mcp/tools/list-templates.ts | Companion to above, remove both |
| Template registry | src/templates/ | 4 template files, effectively dead code |
| WORKFLOW_GUIDANCE constant | src/mcp/server.ts:105-113 | Unused variable, dead code |
| `graphic_intake` prompt | src/mcp/server.ts:165-191 | Prompts rarely invoked, guidance in instructions sufficient |

**Lines of code removable:** ~700 across 8 files

### Should KEEP but SIMPLIFY

| Item | Simplification |
|------|----------------|
| Component system | Useful but should return CSS snippets, not JSON for Claude to interpret |
| Recipe system | Convert to structured JSON with direct CSS/HTML examples |
| Extraction styles | Consolidate 22 files into 3-4 (docs, marketing, landing, in-app) |

---

## 4. Missing Pieces (Should ADD)

| # | What | Why | Priority |
|---|------|-----|----------|
| 1 | `get_icon` tool | Returns actual SVG content for embedding, not just path | Critical |
| 2 | Color resolver in response | Every tool response should include resolved hex values | High |
| 3 | Single "brand brief" endpoint | Consolidates colors + typography + critical rules in one call | High |
| 4 | Pre-flight validation | Validate HTML before rendering (detect ALL CAPS, browser chrome, etc) | Medium |
| 5 | Layout calculator helper | Returns max heights per section given canvas size | Medium |
| 6 | Browser reuse in Puppeteer | Keep browser instance alive across renders | Low |
| 7 | SVG embedding in components | Component JSON should include actual SVG string, not just path | Medium |
| 8 | Error examples in guidance | Show "WRONG: shield shape" vs "RIGHT: cylinder" | Medium |

---

## 5. Why Claude Outputs Gray/Wrong Shapes

### The Problem Flow

1. User asks for graphic
2. Claude may skip `get_style_profile` (not enforced)
3. Claude falls back to generic HTML/CSS knowledge
4. No hex colors specified -> browser defaults (black/gray)
5. "Database" -> Claude draws shield (generic icon) instead of cylinder (brand shape)

### Evidence in Code

**brand.json** has perfect color scales:
```json
"green": { "50": "#EAF8F2", ..., "600": "#259B6C", ... }
```

But `get_style_profile` returns this nested under `colors.scales.green`, requiring Claude to:
1. Know to call the tool
2. Parse nested JSON
3. Remember to use `#259B6C` instead of `green`

### Fix Required

1. **Force tool call** - `render_graphic` should require `get_style_profile` be called first (check in args or return error)
2. **Inline critical colors** - Every tool response should include top 5 hex values
3. **CSS variable injection** - Auto-inject `:root { --green-600: #259B6C; }` into all HTML

---

## 6. Component/Recipe System Assessment

### Components (25 JSON files)

**Good:**
- Well-structured schema (`h-graphic-component-v1`)
- Variants cover use cases (default, semantic, ai-container)
- `svgTemplate` points to actual SVG files

**Bad:**
- `getComponentWithSvg()` exists but Claude must know to ask for it
- No HTML snippet generation - Claude must translate JSON to CSS
- Color tokens (`gray.400`) require separate resolution

### Recipes (7 markdown files)

**Good:**
- Clear step-by-step instructions
- "What to Avoid" sections are excellent
- Component references with SVG paths

**Bad:**
- Raw markdown returned - Claude must parse
- No HTML/CSS examples to copy
- Long (90+ lines) - context window impact

### Recommendation

**Convert to "Style Snippets":**
```json
{
  "box-default": {
    "css": "background: white; border: 1.5px solid #CBD0D7; border-radius: 8px;",
    "html": "<div class=\"node-box\">{{content}}</div>",
    "colorTokens": { "gray.400": "#CBD0D7" }
  }
}
```

---

## 7. Server Instructions Quality

### Current STATE (102 lines in server.ts)

**Strengths:**
- Critical rules section is clear (sentence case, no browser chrome)
- Pre-render checklist is actionable
- Workflow steps are logical

**Weaknesses:**
- No enforcement - Claude can skip all guidance
- Colors mentioned but not provided inline
- "Call get_pattern" instructions but no examples
- Tool descriptions duplicate SERVER_INSTRUCTIONS

### Recommended Changes

1. **Add color reference inline:**
```
## Quick Color Reference
- Primary Green: #259B6C (use for accents)
- Navy Background: #05264C (marketing dark)
- Text: #13151A (primary), #8F99A3 (muted)
```

2. **Add shape guidance:**
```
## Common Shape Mistakes
- Database: Use CSS cylinder (ellipse top/bottom + rect body), NOT shield
- Cursor: Use get_pattern("component:decorative/cursors"), NOT CSS triangle
```

3. **Enforce via render_graphic:**
```typescript
if (!input.html.includes('#') && !input.html.includes('rgb')) {
  return error("No colors detected - did you forget brand tokens?");
}
```

---

## 8. Prioritized Action Plan

### Phase 1: Critical (Do Immediately)

1. **Add inline color reference to SERVER_INSTRUCTIONS**
   - 10 lines change in server.ts
   - Impact: Claude uses correct colors immediately

2. **Add `get_icon` tool that returns SVG content**
   - New tool, ~50 lines
   - Impact: Icons embedded correctly

3. **Fix cursor component to include svgContent by default**
   - Modify get_pattern response for components
   - Impact: Cursors render correctly

### Phase 2: High Priority (This Week)

4. **Remove template system** (4 files, ~400 LOC)
   - registry.ts, 4 template/*.ts files
   - generate-from-template.ts, list-templates.ts
   - Impact: Cleaner codebase, less confusion

5. **Remove create_graphic tool**
   - Its guidance already in SERVER_INSTRUCTIONS
   - Impact: One less confusing tool

6. **Consolidate extraction files**
   - Merge 22 JSON into 4 category files
   - Impact: Faster loading, less duplication

### Phase 3: Medium Priority (This Month)

7. **Convert recipes to JSON with HTML snippets**
   - 7 files to transform
   - Impact: Claude gets copyable code

8. **Add pre-flight HTML validation**
   - Check for ALL CAPS, browser chrome, missing colors
   - Impact: Catch errors before render

9. **Reuse Puppeteer browser instance**
   - Modify PuppeteerRenderer to keep browser alive
   - Impact: Faster batch rendering

### Phase 4: Low Priority (Future)

10. **Remove CSS injection feature** (style_profile param)
11. **Remove graphic_intake prompt**
12. **Add layout calculator helper**

---

## 9. Positive Observations

1. **Rendering pipeline is solid** - Satori + Puppeteer hybrid works well
2. **Font loading is correct** - All TTF files present, weights mapped correctly
3. **Security is good** - Sanitization, path validation, XXE protection
4. **Brand.json is comprehensive** - 462 lines of detailed guidelines
5. **SVG files are well-organized** - brand/svg/, brand/data/icons/ structure
6. **Component schema is extensible** - v1 versioned, variants supported

---

## 10. Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Source files (TS) | 40 | Reasonable |
| Brand assets | 671 | Well-stocked |
| Lines of code (src/) | ~3,200 | Moderate |
| MCP Tools | 10 | Too many; recommend 6 |
| Templates | 4 | Remove (dead code) |
| Components | 25 | Keep, simplify output |
| Recipes | 7 | Keep, convert to JSON |
| Extraction files | 22 | Consolidate to 4 |

---

## Unresolved Questions

1. **Why are v1 extraction files still present?** Loader ignores them but they clutter brand/extracted/
2. **Is template system intended for future expansion?** If so, document; if not, remove
3. **Should components support CSS variables?** Current hex colors limit theming
4. **What's the intended relationship between extraction styles and components?** Overlap is confusing

---

## Files Reviewed

### Core
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/engine.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/puppeteer-renderer.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/export-pipeline.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/font-loader.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/brand-context.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/pattern-css-generator.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/component-loader.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/extraction-loader.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/extraction-types.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/types.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/sanitize.ts`

### MCP Tools
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/server.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/index.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/render-graphic.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/create-graphic.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/get-style-profile.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/get-pattern.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/list-patterns.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/list-icons.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/serve-preview.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/generate-from-template.ts`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/list-templates.ts`

### Brand
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/brand.json`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/components/nodes/box.json`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/components/decorative/cursors.json`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/recipes/diagrams/architecture-flow.md`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/svg/decorative/cursor.svg`
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/extracted/landing-page-styles.json`

### Templates
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/templates/registry.ts`

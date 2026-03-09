# Output Checklist

## CRITICAL CHECKS (Do These First!)

- [ ] **Sentence case only** - No ALL CAPS, no `text-transform: uppercase`
- [ ] **No browser chrome** - No macOS window dots (red/yellow/green), no fake title bars
- [ ] **No OS emojis** - Use brand icons or CSS shapes instead
- [ ] **Height calculated** - Total content ≤ canvas height
- [ ] **Bottom padding ≥ 32px** - Content must not touch canvas edge
- [ ] **No negative positioning** - No `top: -12px` for badges (causes clipping)
- [ ] **Cursors use brand SVG** - From `component:decorative/cursors`, never CSS tricks
- [ ] **Icons from brand library** - Call `list_icons` first, never generate small SVGs

---

Before finalizing any graphic, verify:

## Brand Compliance

- [ ] Colors use brand tokens (green.X, blue.X, gray.X, purple.X)
- [ ] Typography uses Inter (UI) or JetBrains Mono/IBM Plex Mono (code)
- [ ] No raw hex colors outside of brand.json definitions
- [ ] Follows docs OR marketing style (not mixed)

## Layout

- [ ] Clear visual hierarchy
- [ ] Adequate spacing (min 80px between major elements)
- [ ] Proper alignment (elements align to grid)
- [ ] Flow direction is clear (LTR, TTB, or radial)

## Layout Safety (CRITICAL - prevents broken graphics)

- [ ] **Content fits canvas** - Calculate total height before rendering
- [ ] **Bottom padding ≥ 32px** - Content must not touch canvas edge
- [ ] **No negative positioning** - Avoid `top: -12px` etc. for badges
- [ ] **Explicit heights** - Use pixel values, not `flex: 1` for critical sections
- [ ] **Badges inside bounds** - Use `transform: translateY(-50%)` not negative offsets
- [ ] **Consistent panel heights** - All cards/panels in a row should match
- [ ] **Test at exact canvas size** - Verify nothing clips or overflows

### Height Calculation Template
```
Canvas height: [X]px
- Top padding: 32-48px
- Header/title: ~80-100px
- Main content: ~[calculate]px
- Footer/labels: ~50-60px
- Bottom padding: 32-48px
─────────────────────────
Total must be ≤ canvas height
```

### Safe Badge Positioning
```css
/* BAD - clips outside parent */
.badge { position: absolute; top: -12px; }

/* GOOD - stays within bounds */
.badge {
  position: absolute;
  top: 0;
  transform: translateY(-50%);
}
/* OR use margin on parent */
.panel { margin-top: 16px; }
.badge { position: absolute; top: 0; }
```

## Typography

- [ ] Text is readable (min 15px)
- [ ] Proper contrast with background
- [ ] Font weights appropriate (400-600)
- [ ] Labels positioned near their elements

## Components

- [ ] Correct variant used for context (docs vs marketing)
- [ ] Borders consistent throughout
- [ ] Border radius consistent (don't mix 8px and 20px)
- [ ] Shadows appropriate for style

## Connectors

- [ ] Lines connect logically
- [ ] Arrow direction is correct
- [ ] Step indicators in sequence
- [ ] Connection dots at endpoints

## Marketing Specifics

- [ ] Background gradient applied correctly
- [ ] Blur/glow effects render properly
- [ ] Text has appropriate shadow on dark backgrounds
- [ ] CTA button if needed

## SVG Assets (CRITICAL)

### Asset Discovery (MANDATORY before rendering)
- [ ] **Cursors**: Called `get_pattern("component:decorative/cursors")` - use returned `svgContent`
- [ ] **Icons**: Called `list_icons` to find available icons
- [ ] **Arrows**: Called `get_pattern("component:decorative/arrows")` or used `brand/svg/arrows/`
- [ ] **Connectors**: Called `get_pattern("component:connectors/...")` for flow lines

### SVG Rendering
- [ ] ViewBox has 5-10% padding (elements not at 0 or max)
- [ ] Icons are ≥16px (prefer 20px+ for stroke-based)
- [ ] Small icons use `fill` not `stroke`
- [ ] No CSS tricks for cursors (use actual SVG)
- [ ] Data points align with actual curve paths (not Bezier control points)

### Common Failures to Avoid
| Element | Bad | Good |
|---------|-----|------|
| Cursor | `border-radius: 0 50% 50% 50%` | Embed SVG from component |
| Small icon | `<svg width="12">` with stroke | `<svg width="20">` with fill |
| Line chart | Points at Q control points | Points on visual curve |
| ViewBox | Content at edges (0, max) | 5-10% padding buffer |

## Technical

- [ ] SVG assets embedded correctly
- [ ] No broken image references
- [ ] Responsive considerations if applicable
- [ ] Renders correctly at target size

## Final Steps

1. **Preview** - View at actual size
2. **Compare** - Check against similar existing graphics
3. **Iterate** - Make refinements if needed
4. **Export** - Render to PNG/SVG via MCP tool

# Creative Guidance

## CRITICAL RULES (Read First!)

### Typography
- **Sentence case ONLY** - NEVER use ALL CAPS or `text-transform: uppercase`
- Exception: Acronyms (API, SQL, APAC) are proper nouns

### What NOT to Add
- **No browser chrome** - Don't add macOS window dots (red/yellow/green), title bars, or fake browser UI
- **No OS emojis** - Use brand icons from `brand/data/icons/` or CSS shapes
- **No decorative elements** not specified in the brand system
- **No mixed styles** - Don't combine docs and marketing patterns in one graphic

### Layout Safety
- **Calculate heights BEFORE coding** - Sum all sections, total must be ≤ canvas height
- **Reserve 32-48px bottom padding** - Content must not touch canvas edge
- **No negative positioning** - `top: -12px` causes clipping, use `transform: translateY(-50%)`
- **Explicit heights only** - Never use `flex: 1` for critical sections

---

## Design Philosophy

Components define **HOW things look** (styling rules).
AI decides **WHAT to create** (creative concept, composition).

| Layer | What | Who Decides |
|-------|------|-------------|
| Creative concept | Visual metaphor, composition | AI + context |
| Style application | Colors, fonts, effects | Components |
| Brand guardrails | What to avoid, color ratios | brand.json |

## Docs vs Marketing Style

| Aspect | Docs | Marketing |
|--------|------|-----------|
| Background | White/transparent | Navy gradients, mesh |
| Borders | 1px, subtle | 2-3px, prominent |
| Border radius | 6-8px | 11-20px |
| Typography | 18-25px | 35-45px |
| Effects | Flat, minimal | Blur, glows, gradients |
| Icons | Small, functional | Large, decorative |
| Arrows | Thin, gray | Thick, gradient |
| Purpose | Explain | Impress |

## Tiered SVG Approach

| Complexity | Approach | Example |
|------------|----------|---------|
| Simple | AI generates CSS | Rectangles, circles, straight lines |
| Medium | AI uses reference SVG | Curved arrows, elbow connectors |
| Complex | AI embeds pre-made SVG | Charts, decorative shapes, icons |

## Color Creativity

While staying within brand palette:

### Green Scale (PRIMARY)
- green.50 → green.900
- Use for: Primary accent, success, semantic, highlights, CTAs, emphasis

### Blue Scale (SECONDARY)
- blue.50 → blue.800: Secondary accents, nested sections, code highlights
- blue.900 (Navy): Primary dark background for marketing graphics

### Purple Scale (SECONDARY)
- purple.50 → purple.900
- Use for: Secondary accents, code syntax, alternative highlights

### Gray Scale
- gray.50 → gray.900
- Use for: Text, borders, neutral elements, docs backgrounds

## Composition Principles

1. **Hierarchy**: Most important element largest/brightest
2. **Flow**: Guide eye left→right, top→bottom
3. **Balance**: Distribute visual weight
4. **Contrast**: Light on dark, dark on light
5. **Spacing**: Minimum 80px between major elements
6. **Grouping**: Related elements share containers

## Layout Safety (CRITICAL)

Before writing any HTML/CSS, calculate total content height:

```
Canvas: [width] x [height]px
─────────────────────────────
Top padding:     32-48px
Header/title:    80-100px
Main content:    [calculate]px
Footer/labels:   50-60px
Bottom padding:  32-48px (MINIMUM)
─────────────────────────────
Total MUST be ≤ canvas height
```

### Safe Patterns

| Element | Safe | Unsafe |
|---------|------|--------|
| Badge position | `transform: translateY(-50%)` | `top: -12px` |
| Section height | Explicit pixels | `flex: 1` |
| Panel spacing | `margin-top` on parent | Negative offsets |
| Content overflow | `overflow: hidden` + test | Assume it fits |

### Pre-render Checklist

1. [ ] Total height calculated and fits canvas
2. [ ] Bottom padding ≥ 32px reserved
3. [ ] No negative positioning on badges/labels
4. [ ] All panels in a row have consistent heights
5. [ ] Absolute elements stay within parent bounds

## SVG Rendering Best Practices (CRITICAL)

### ALWAYS Use Brand Assets

| Element | DO | DON'T |
|---------|-----|-------|
| Cursors/pointers | Embed SVG from `get_pattern("component:decorative/cursors")` | CSS tricks like `border-radius: 0 50% 50% 50%` |
| Icons | Use `list_icons` then embed from `brand/data/icons/` | Generate tiny inline SVGs with strokes |
| Arrows | Use `get_pattern("component:decorative/arrows")` | Hand-draw SVG paths |
| Chart icons | Use `brand/data/icons/chart/*.svg` | Draw charts from scratch |

### Fetching SVG Content

```
// Step 1: Get component with SVG content
get_pattern("component:decorative/cursors")
→ Returns { svgContent: "<svg>...</svg>", svgUsage: { cssVariables: ["--fill-0", "--stroke-0"] } }

// Step 2: Embed in HTML with customization
<div style="width: 40px; height: 40px; --fill-0: #9250E5; --stroke-0: white;">
  <svg><!-- paste svgContent here --></svg>
</div>
```

### SVG ViewBox Rules

| Rule | Good | Bad |
|------|------|-----|
| Edge padding | `viewBox="0 0 300 180"` with content at 10-290 | Content at 0 or 300 (clips) |
| Min icon size | Icons ≥ 16x16px | Icons 12x12 or smaller |
| Stroke vs fill | `fill` for small icons | `stroke` for icons < 20px |
| Point alignment | Points on actual curve path | Points at Bezier control points |

### Inline SVG Checklist

- [ ] ViewBox has 5-10% padding buffer on all edges
- [ ] No elements positioned at viewBox min (0) or max
- [ ] Icons minimum 16x16px, prefer 20x20+ for stroke icons
- [ ] Small icons (< 20px) use `fill` not `stroke`
- [ ] SVG paths tested - Bezier control points ≠ visual points
- [ ] Colors use CSS variables or brand tokens

### Common SVG Mistakes

```html
<!-- BAD: Cursor with CSS tricks (won't render reliably) -->
<div class="cursor" style="border-radius: 0 50% 50% 50%; transform: rotate(-45deg);"></div>

<!-- GOOD: Embed actual SVG from component -->
<div class="cursor" style="width: 40px;">
  <svg viewBox="0 0 98.5 98.7" fill="none">
    <path d="M26.75 30.78..." fill="var(--fill-0, #9250E5)" stroke="var(--stroke-0, white)"/>
  </svg>
</div>

<!-- BAD: Tiny inline SVG with strokes -->
<svg width="12" height="12"><path stroke="white" stroke-width="2"/></svg>

<!-- GOOD: Use brand icon at proper size -->
<img src="brand/data/icons/chart/bar.svg" width="20" height="20"/>
<!-- OR embed inline at proper size -->
<svg width="20" height="20" viewBox="0 0 24 24"><!-- icon content --></svg>
```

## What to Avoid

- Mixing docs and marketing styles
- Using raw hex colors (use brand tokens)
- Overly complex layouts
- Text smaller than 15px
- Borders thicker than 4px (except marketing)
- Too many competing focal points
- **Negative positioning** (`top: -12px`) for badges - causes clipping
- **`flex: 1`** for critical section heights - unpredictable
- **No bottom padding** - content touches canvas edge
- **Unequal panel heights** in rows - visual imbalance
- **CSS cursor tricks** - use brand SVG from `component:decorative/cursors`
- **Tiny stroke SVGs** - icons must be ≥16px, use fill for small sizes
- **Generating icons from scratch** - always check `list_icons` first

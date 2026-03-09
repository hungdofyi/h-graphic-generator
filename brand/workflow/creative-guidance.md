# Creative Guidance

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

## What to Avoid

- Mixing docs and marketing styles
- Using raw hex colors (use brand tokens)
- Overly complex layouts
- Text smaller than 15px
- Borders thicker than 4px (except marketing)
- Too many competing focal points

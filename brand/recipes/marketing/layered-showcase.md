# Layered Showcase Graphic

## When to Use
- Feature depth demonstration
- Dashboard tab switching
- Multi-window interfaces
- Embed portal features

## Required Inputs
- Feature name
- Number of layers/tabs (typically 3)
- Content for each layer (simplified mockups)
- Optional: floating panel

## Components Used

| Element | Component | Usage |
|---------|-----------|-------|
| Background | backgrounds/gradients (layered-navy) | Navy gradient base |
| Stacked cards | layouts/stacked-cards | Multiple offset cards |
| Layered windows | layouts/layered-windows | Overlapping windows |
| Dashboard cards | containers/dashboard-mockup | Simplified UI |
| Floating panel | containers/frosted-card (settings-panel) | White overlay |
| Charts | decorative/simplified-illustrations | Bar/pie mockups |

## Pattern A: Stacked Tabs

### Construction
1. **Background** (250deg, blue.900 → blue.800)
2. **Text on left** (headline + subheadline)
3. **Stack 3 cards** diagonal offset
   - Back: x+544, y+0, opacity 0.85
   - Middle: x+272, y+196, opacity 0.9
   - Front: x+0, y+392, opacity 1
4. **Each card** has tab header + body
5. **Fade overlays** at bottom of back cards

### Tab Style
- Background: linear-gradient(to bottom, #457ab9 30%, transparent)
- Border: #89b5df, 2.8px
- Border radius: 14px 14px 0 0
- Size: 232px × 80px

### Card Body
- Background: linear-gradient(to bottom, #457ab9 10%, #134882 74%)
- Border: #8ab0d9, 2.8px
- Border radius: 17px

## Pattern B: Layered Windows

### Construction
1. **Background** (250deg, blue.900 → blue.800)
2. **Text on left** (5-42% width)
3. **Layer 3 windows**
   - Background: rightmost, gradient fade
   - Middle: overlapping, main content
   - Foreground: white panel, strong shadow
4. **Add floating panel** if needed (settings, config)
5. **Add interaction cursor** if showing drag/click

### Window Style
- Background: gradient (166deg, rgba(26,79,141,1) → transparent)
- Border radius: 13px
- Foreground shadow: 8px -4px 24px rgba(0,0,0,0.25)

## Simplified Dashboard Content

| Element | Style |
|---------|-------|
| KPI cards | #8ab0d9 border, blue.200 text |
| Progress bars | #3f77b8 background |
| Bar charts | blue.500-800 gradient bars |
| Labels | blue.200, Inter 400, 26px |
| Values | blue.200, Inter 500, 61px |

## Layout
- Text column: 5-35% (stacked) or 5-42% (layered)
- Visual column: 35-100% (stacked) or 42-100% (layered)

## Typography
- Headline: white, Inter 600, 105px
- Subheadline: gray.500, Inter 500, 55px
- Tab labels: white, Inter 500, 28px

## Color Notes
- Green: Primary brand accent (highlights, success, CTAs)
- Navy (blue.900): Dark marketing backgrounds
- Blue.50-800: Secondary accents, nested sections

## What to Avoid (CRITICAL)

### Typography
- **No ALL CAPS** - Use sentence case only, never `text-transform: uppercase`
- Exception: Acronyms like API, SQL are proper nouns

### Decorative Elements
- **No browser chrome** - Don't add macOS window dots (red/yellow/green)
- **No fake window title bars** - These are marketing graphics, not app screenshots
- **No OS emojis** - Use brand icons or CSS shapes instead

### Layout
- **Calculate height before coding** - Sum all sections, must fit canvas
- **Reserve bottom padding** - Minimum 32-48px, content must not touch edge
- **No negative positioning** - `top: -12px` causes clipping, use `transform: translateY(-50%)`
- **No `flex: 1`** - Use explicit pixel heights for predictable sizing

### Styling
- **No raw hex colors** - Use brand tokens (green.500, blue.900, etc.)
- **No mixed styles** - This is marketing style, don't mix with docs patterns
- **No inconsistent radii** - Marketing uses 11-20px, keep consistent

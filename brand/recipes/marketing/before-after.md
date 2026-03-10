# Before/After Comparison Graphic

## When to Use
- Feature improvement demonstrations
- UI/UX transformation showcases
- Product evolution comparisons
- AI capability demonstrations
- Version upgrade highlights

## Required Inputs
- Before screenshot/mockup
- After screenshot/mockup
- Labels ("Before"/"After" or custom like "Without AI"/"With AI")
- Layout variant (vertical, split-slider, side-by-side cards)

## Layout Variants

### Variant A: Vertical Stacked
Best for: Detailed comparisons with multiple UI elements, long-form content

```
┌─────────────────────────────────────┐
│  Before                             │  ← Large label (80px)
│  ┌─────────────┐  ┌──────────────┐  │
│  │  Screenshot │  │  Panel       │  │
│  │             │  │              │  │
│  │  + overlay  │  │              │  │
│  └─────────────┘  └──────────────┘  │
├─────────────────────────────────────┤
│  After                              │  ← Large label (80px)
│  ┌─────────────┐  ┌──────────────┐  │
│  │  Screenshot │  │  Panel       │  │
│  │             │  │  (green      │  │
│  │  + highlight│  │   border)    │  │
│  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
```

**Construction:**
1. **Background**: Light blue (#E8F2FD / blue.50)
2. **Before section** (top half):
   - Label: "Before" (80px, Inter 600, blue.900)
   - Screenshots with gray.400 borders (3px)
   - Fade overlay: gradient to white at bottom
   - Highlight overlays: gray (#656A72) with `mix-blend-mode: hard-light`
3. **After section** (bottom half):
   - Label: "After" (80px, Inter 600, blue.900)
   - Screenshots with green.400 borders (3px)
   - Fade overlay: gradient to blue.50 at bottom
   - Highlight overlays: green (#68AB79) with `mix-blend-mode: hard-light`

**Styles:**
| Element | Before | After |
|---------|--------|-------|
| Border color | gray.400 (#CBD0D7) | green.400 (#52C396) |
| Border width | 3-4px | 3-4px |
| Border radius | 10-15px | 10-15px |
| Highlight | gray (#656A72) | green (#68AB79) |
| Background | white | white |

---

### Variant B: Split View with Slider
Best for: Direct side-by-side comparison, feature toggle demonstrations

```
┌─────────────────────────────────────────┐
│ Before                         After    │
│ ┌────────────────┐▐┌────────────────┐   │
│ │                │▐│                │   │
│ │  Screenshot    │▐│  Screenshot    │   │
│ │  (gray bg)     │▐│  (green tint)  │   │
│ └────────────────┘▐└────────────────┘   │
└─────────────────────────────────────────┘
                    ↑
         Divider at frame center
```

**IMPORTANT: Overlapping Layers Architecture**

This is NOT two side-by-side columns. It's two **overlapping full-width layers** where each shows only half:

```css
/* Container */
.split-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Before layer - full width, offset to show left half */
.before-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  left: -50%;  /* Offset so right edge aligns with center */
  overflow: hidden;
}

/* After layer - full width, centered to show right half */
.after-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
  overflow: hidden;
}

/* Divider - exactly at frame center */
.divider {
  position: absolute;
  left: calc(50% - 16px);  /* 32px wide, centered */
  top: 0;
  width: 32px;
  height: 100%;
  background: #BBD7F7;  /* blue.200 */
  z-index: 10;
}
```

**Construction:**
1. **Container**: `position: relative; overflow: hidden`
2. **Before layer** (full width, offset left):
   - Position: `left: -50%` or `left: -[half of frame width]px`
   - Background: gray gradient (gray.400 82.5% → gray.50)
   - Label: "Before" (70px, Inter 600, #666970) - positioned in visible area
   - Screenshot: centered within layer, 12px border-radius
3. **After layer** (full width, showing right half):
   - Position: `left: 50%; transform: translateX(-50%)`
   - Background: green tint gradient
   - Label: "After" (70px, Inter 600, green.500) - positioned in visible area
   - Screenshot: centered within layer, 12px border-radius
4. **Divider bar** (at exact frame center):
   - Position: `left: calc(50% - 16px)` for 32px bar
   - Background: blue.200 (#BBD7F7)
   - Height: 100%
   - z-index: 10 (above both layers)

**Background Gradients:**
```css
/* Before side - gray */
background: linear-gradient(to bottom, #CBD0D7 82.5%, #F9FBFC 112%);

/* After side - green tint */
background: linear-gradient(
  125deg,
  #ECF5FF 2.5%,
  #E0EEED 30.5%,
  #EAF8F2 73%,  /* green.50 */
  #F2FCF8 107%
);

/* Divider - solid or gradient */
background: #BBD7F7;  /* solid blue.200 */
/* OR gradient variant (13px wide): */
background: linear-gradient(to bottom, #205B98, #7AD1AE 50%, #D1E5FA);
```

---

### Variant C: Side-by-Side Cards (Dark)
Best for: Marketing materials, feature showcases, premium feel

```
┌─────────────────────────────────────────────┐
│         ◇  Navy gradient + shapes  ◇        │
│                                             │
│   ┌─ Before ─┐          ┌─ After ──┐        │
│   │          │          │          │        │
│   │ ┌──────┐ │          │ ┌──────┐ │        │
│   │ │ img  │ │          │ │ img  │ │        │
│   │ └──────┘ │          │ └──────┘ │        │
│   │  glass   │          │  glass   │        │
│   └──────────┘          └──────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

**Construction:**
1. **Background**: Navy gradient with decorative shapes
   ```css
   background: linear-gradient(-84deg, #0A4185 44%, #09264A 85%);
   ```
2. **Decorative shapes**: Blurred polygons/ellipses at corners (optional)
3. **Label pills** (centered above each card):
   - Background: radial gradient (white 20% → 50%, opacity 0.6)
   - Border: 1px solid white
   - Border radius: 12px
   - Text: 45px Inter 500, green.50 (#EAF8F2), text-shadow
   - Padding: 12px 45px
4. **Glass containers**:
   - Background: rgba(255, 255, 255, 0.2)
   - Border: 1px solid white
   - Border radius: 20px
   - Padding: 16px
5. **Screenshots**: Inside containers with cover fit

**Label Pill Style:**
```css
.label-pill {
  position: relative;
  border-radius: 12px;
  padding: 12px 45px;
  color: #EAF8F2;
  font: 500 45px Inter;
  letter-spacing: -0.45px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  /* Translucent border via inset shadow - very subtle */
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
}
/* Radial gradient as pseudo-element at 60% opacity */
.label-pill::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: radial-gradient(
    ellipse 100% 160% at center bottom,
    rgba(255,255,255,0.1) 0%,
    rgba(255,255,255,0.25) 100%
  );
  opacity: 0.6;
  z-index: -1;
}
```

**Glass Container Style:**
```css
.glass-container {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 16px;
  /* Very subtle translucent border */
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.15),
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 4px 24px rgba(0,0,0,0.1);
}
```

---

## Components Used

| Element | Component | Usage |
|---------|-----------|-------|
| Background (light) | backgrounds/solid | blue.50 for vertical |
| Background (dark) | backgrounds/gradients | Navy mesh for cards |
| Split divider | (custom) | Vertical bar, solid or gradient |
| Glass container | containers/frosted-card | Dark variant containers |
| Labels | typography/marketing | Headlines 45-80px |
| Screenshots | containers/preview-panel | With border styling |
| Highlights | highlights/spotlight | mix-blend overlays |

## Typography

| Element | Vertical | Split View | Side-by-Side |
|---------|----------|------------|--------------|
| Label size | 80px | 64-70px | 45px |
| Label weight | 600 | 600 | 500 |
| Before color | blue.900 | gray (#666970) | green.50 |
| After color | blue.900 | green.500 | white |

## Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| blue.50 | #E8F2FD | Light background |
| blue.200 | #BBD7F7 | Divider bar |
| blue.900 | #05264C | Navy gradient, text |
| green.50 | #EAF8F2 | Light accent, label text |
| green.400 | #52C396 | After borders |
| green.500 | #2CB67F | After labels |
| gray.400 | #CBD0D7 | Before borders |
| gray (#666970) | - | Before label text |

## Highlight Overlays

For emphasizing differences:
```css
/* Before (neutral) */
.highlight-before {
  background: #656A72;
  mix-blend-mode: hard-light;
}

/* After (positive) */
.highlight-after {
  background: #68AB79;
  mix-blend-mode: hard-light;
}
```

## What to Avoid (CRITICAL)

### Typography
- **No ALL CAPS** - Use sentence case only
- Exception: Acronyms like AI, API are proper nouns

### Decorative Elements
- **No browser chrome** - Don't add macOS window dots (red/yellow/green)
- **No fake window title bars**
- **No OS emojis** - Use brand icons or CSS shapes

### Layout
- **Calculate height before coding** - Sum all sections, must fit canvas
- **Reserve bottom padding** - Minimum 32-48px
- **No negative positioning** - Use transforms instead
- **Consistent screenshot sizing** - Before and After should be same dimensions

### Styling
- **Match border radius** - Keep consistent between Before/After
- **Same screenshot scale** - Don't resize one side differently
- **Clear visual distinction** - Before should feel "old/plain", After should feel "new/better"

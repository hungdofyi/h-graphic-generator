# Spotlight Feature Graphic

## When to Use
- Feature announcements
- Beta feature launches
- New capability highlights
- Action button promotions

## Required Inputs
- Feature icon or visual
- Headline text
- Optional: Subheadline
- Background style (mesh gradient)

## Components Used

| Element | Component | Usage |
|---------|-----------|-------|
| Background | backgrounds/mesh (blue-mesh or green-mesh) | Dark gradient with blur |
| Spotlight | highlights/spotlight (circle) | Highlight single element |
| Icon container | highlights/spotlight (content) | Green background, rounded |
| Plus indicator | highlights/spotlight (plusIndicator) | Show "add" action |
| Cursor | decorative/cursors (pointer-white) | Interaction hint |
| Typography | typography/marketing | Headlines, labels |

## Construction Steps

1. **Set mesh gradient background** with blur overlay
2. **Position text on left** (5-35% width)
   - Headline (85px, 600 weight)
   - Subheadline (55px, 500 weight)
3. **Position spotlight on right** (35-100%)
   - Outer glow (radial gradient, 406px)
   - Ring (336px, blue.200 border, white fill)
   - Content (green.500 background, 15px radius)
4. **Add icon** inside spotlight content
5. **Optional: Add plus indicator** top-left of content
6. **Add cursor** bottom-right of spotlight

## Spotlight Structure

```
┌─────────────────────────────┐
│     Outer Glow (406px)      │
│   ┌─────────────────────┐   │
│   │   Ring (336px)      │   │
│   │  ┌───────────────┐  │   │
│   │  │ Content (icon)│  │   │
│   │  └───────────────┘  │   │
│   └─────────────────────┘   │
└─────────────────────────────┘
                        ↖ Cursor
```

## Layout Variants

### Left Text, Right Spotlight
```
textColumn: 5-35%
visualColumn: 35-100%
```

### Left Text, Right Form (Row Highlight)
```
textColumn: 5-45%
formColumn: 42-100%
```
Uses row highlight technique instead of circle spotlight.

## Typography
- Headline: white, Inter 600, 85px, -0.85px letter-spacing
- Subheadline: gray.500, Inter 500, 55px, 1.1px letter-spacing
- Feature title: white, Roboto 500, 72px

## Color Palette
- Background: Navy gradient (blue.900 base) - dark marketing background
- Spotlight ring: blue.200 border, white background
- Content: green.500 background (PRIMARY accent)
- Text: white, gray.500
- Note: Green is primary brand color, navy is for dark backgrounds

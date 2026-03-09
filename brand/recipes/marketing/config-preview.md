# Config-to-Preview Mapping

## When to Use
- CSS/theme customization
- API configuration results
- Model definition visualization
- Permission settings → filtered data
- Code → generated output

## Required Inputs
- Configuration code/text
- Visual result representation
- Mapping lines (which config → which visual element)
- Optional: cursor pointing to active line

## Components Used

| Element | Component | Usage |
|---------|-----------|-------|
| Background | backgrounds/gradients (green-gradient) | Fresh green gradient |
| Code block | containers/code-block (config-preview) | Dark editor panel |
| Preview panel | containers/preview-panel (green-gradient) | Nested dashed containers |
| Connection lines | connectors/straight (config-mapping) | White lines |
| Cursor | decorative/cursors (config-pointer) | Point to active line |
| Charts | decorative/simplified-illustrations (barChart.config) | Green bars |

## Construction Steps

1. **Set green gradient background**
   - `linear-gradient(131deg, green.300 0%, green.600 100%)`
   - Border radius: 10px

2. **Position code block on left** (5-35% width)
   - Dark background (gray.800)
   - Border radius: 12px
   - Show hierarchical config structure

3. **Add highlighted line** in code block
   - Gradient background (blue.600 → green.600)
   - Height: 66px
   - White text

4. **Position preview panel on right** (40-100% width)
   - Outer dashed border (green.200, 2.4px)
   - Inner nested containers
   - Show visual representation

5. **Draw connection lines** between code sections and preview elements
   - White color, 17px height
   - End with dot (12px, white)

6. **Add cursor** near highlighted line

## Code Block Structure

```
┌─────────────────────────────┐
│ placeholder line            │
│ placeholder line            │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← highlighted (gradient)
│ placeholder line            │
│   placeholder line          │
│ placeholder line            │
└─────────────────────────────┘
```

## Preview Panel Structure

```
┌- - - - - - - - - - - - - -┐
│ ┌- - - - - - - - - - - -┐ │
│ │ ┌- - - - - - - - - -┐ │ │
│ │ │     [Chart]       │ │ │
│ │ └- - - - - - - - - -┘ │ │
│ └- - - - - - - - - - - -┘ │
└- - - - - - - - - - - - - -┘
```

## Layout

```
┌───────────┬───────────┬─────────────────────┐
│ Code      │ Lines     │ Preview             │
│ 5-35%     │ 35-45%    │ 40-100%             │
└───────────┴───────────┴─────────────────────┘
```

## Color Palette
- Background: green.300 → green.600
- Code block: gray.800
- Code text: gray.600 (default), white (highlighted)
- Highlight: blue.600 → green.600 gradient
- Preview: green.100, green.200, green.300 (nested)
- Lines: white
- Charts: green.400

## Title Label
- Container: rgba(255,255,255,0.25) background
- Border: green.300, 2px
- Text: green.600, Inter 500, 25px

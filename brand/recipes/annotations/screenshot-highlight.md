# Screenshot Highlight Recipe

## When to Use
- Feature documentation
- Release notes
- UI tutorials
- Highlighting specific UI elements

## Required Inputs
- Screenshot image
- Element(s) to highlight
- Optional: Text annotations
- Optional: Cursor position

## Components Used

| Element | Component | Usage |
|---------|-----------|-------|
| Backdrop | highlights/screenshot-overlay (darkened-backdrop) | Dim full screenshot |
| Focus panel | highlights/screenshot-overlay (focusPanels) | Sharp highlight area |
| Row highlight | highlights/screenshot-overlay (rowHighlight) | Highlight specific row |
| Cursor | decorative/cursors (green-cursor) | Point to element |
| Border frame | highlights/screenshot-overlay (borderFrame) | Frame around backdrop |

## Construction Steps

### Pattern A: Focus Panel Over Backdrop
1. **Full screenshot as backdrop** with dark overlay (rgba(0,0,0,0.3))
2. **Border frame** around backdrop (blue.100, 3px, radius 20)
3. **Focus panel** overlaid at specific position (sharp, with shadow)
4. **Optional cursor** pointing to highlighted element
5. **Text annotations** outside frame if needed

### Pattern B: Split Screen with Annotations
1. **Screenshot on left** (8-42% width)
2. **Clipped sections** if showing different parts
3. **Row highlight** on specific items
4. **Context menu** if showing dropdown
5. **Text on right** (headline + bullet list)

### Pattern C: Layered Screenshots
1. **Header section** (separate clip)
2. **Content section** (main area)
3. **Overlay panels** (menus, dialogs)
4. **Cursor interaction**

## Background Options
- **Green mesh**: linear-gradient(-84deg, green.700 43%, blue.900 80%)
- **Green mesh alt**: linear-gradient(256deg, green.700 23%, blue.900 61%)
- With blur overlay: blue.900, 156px blur

## Shadow Styles

| Panel Type | Shadow |
|------------|--------|
| Floating panel | 0 16px 32px -8px rgba(19,21,26,0.16) |
| Context menu | 0 32px 48px -8px rgba(19,21,26,0.2) |

## Text Annotation Positioning
- Layout: screenshot left (8-42%), text right (47-100%)
- Alignment: top-aligned with screenshot content
- Headline: white, Inter 600, 76px
- Bullets: white, Inter 400, 36px, line-height 1.71

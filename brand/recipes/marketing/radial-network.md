# Radial Network Graphic

## When to Use
- Partner/referral programs
- Integration ecosystem diagrams
- Multi-tenant architecture
- Data source connections
- Community/user network
- Platform connectivity

## Required Inputs
- Central hub (logo, icon, or text)
- Satellite nodes (4-6 typically)
- Connection style (straight lines)
- Optional: CTA button
- Optional: Promotional text

## Components Used

| Element | Component | Usage |
|---------|-----------|-------|
| Background | backgrounds/gradients (deep-navy) | Navy with blur shapes |
| Rings | layouts/radial-network (concentricRings) | Ripple effect |
| Hub | layouts/radial-network (centralHub) | Center logo/icon |
| Satellites | layouts/radial-network (satelliteNodes) | Connected nodes |
| Lines | layouts/radial-network (connectionLines) | Connect to hub |
| CTA | typography/marketing (ctaButton) | Call to action |
| Gradient text | typography/marketing (gradient-text) | "$300" style |

## Construction Steps

1. **Set deep navy background**
   - `linear-gradient(120deg, blue.900 5%, #052233 92%)`
   - Add blur shapes for depth

2. **Draw concentric rings** (center offset 60% from left)
   - 5-8 rings
   - Stroke: rgba(255,255,255,0.1), 1px

3. **Place central hub** (292px)
   - Logo or icon
   - Colors: green.400, green.600, white

4. **Scatter satellite nodes** (4-6)
   - Varying sizes (75-134px)
   - Varying distances from hub
   - Asymmetric, organic placement

5. **Draw connection lines** from satellites to hub
   - Color: rgba(255,255,255,0.15), 2px

6. **Add text on left** (7-50% width)
   - Headline with gradient text
   - Subtext
   - CTA button

7. **Add cursor** near CTA button

## Satellite Node Style

```css
.satellite-node {
  background: linear-gradient(to bottom, blue.800, #0c3f6f);
  border: 4px solid #819ab3;
  border-radius: 11px;
}
.satellite-icon {
  opacity: 0.3;
  color: white;
}
```

## Depth Effect
- Larger nodes appear closer (full opacity)
- Smaller nodes appear farther (lower opacity)
- Creates organic, scattered distribution

## Typography

### Gradient Text
```css
.gradient-text {
  background: linear-gradient(to bottom, #67f8c7, green.600);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 4px 4px 8.5px rgba(0,0,0,0.15);
}
```

### Size Variants
- Large: 221px (promotional numbers)
- Medium: 79px
- Small: 72px

## CTA Button
- Background: linear-gradient(103deg, blue.600 15%, blue.800 109%)
- Border: blue.200, 4px
- Border radius: 63px
- Size: 350px × 96px
- Text: white, Inter 600, 44px

## Animation Potential
- Rings: pulse outward from center
- Satellites: subtle float or orbit
- Connections: draw-in effect
- Hub: gentle glow pulse

# Architecture Flow Diagram

## When to Use
- Service/system connections
- API relationships
- Data flow between components
- Permission flows
- Embed mechanisms

## Required Inputs
- Nodes (name, type, icon?)
- Connections (from → to, label?)
- Grouping? (which belong together)
- Direction (LTR, TTB, custom)

## Components Used

| Element | Component | SVG |
|---------|-----------|-----|
| Service box | nodes/box (default) | - |
| Database | nodes/box | svg/diagram-icons/database.svg |
| Connection | connectors/elbow | svg/connectors/elbow-*.svg |
| Step indicator | nodes/step-indicator | - |
| Connection dot | nodes/connection-dot | - |
| Section container | nodes/box (section-dashed) | - |
| Nested section | nodes/box (nested-blue) | - |

## Construction Steps

1. **Layout direction** (LTR, TTB, custom)
2. **Place nodes** (min 80px spacing)
3. **Route connections** (prefer elbow for right angles)
4. **Add step indicators** if showing sequence
5. **Apply labels** (Inter 500, gray.800)
6. **Set background** (white or transparent for docs)

## Text-on-Line Pattern
- Position labels beside connectors, not breaking them
- Use gray.700 for annotation text
- Step numbers in circles along the path

## Example Compositions

### Three-Column Flow
```
Left → Center → Right flow pattern
Example: Application Code → Holistics → Final Data
Layout: flex, gap: 24, columnWidth: 33%
Usage: Permission flows, data transformation pipelines
```

### Nested Architecture
```
Outer container with nested sections
Example: Your Application → [Back End, Front End]
Usage: System architecture, component hierarchy
```

### Parallel Comparison
```
Multiple similar blocks showing variations
Example: Customer 1, Customer 2, Global Admin code blocks
Usage: Different configurations, user types, scenarios
```

## Color Usage
- Borders: gray.400 (default), green.600 (semantic)
- Backgrounds: white, gray.100 (sections), blue.50 (nested)
- Text: gray.800 (labels), green.600 (component names)
- Connectors: gray.600 (default), green.600 (emphasized)

## What to Avoid (CRITICAL)

### Typography
- **No ALL CAPS** - Use sentence case only, never `text-transform: uppercase`
- Exception: Acronyms like API, SQL, ETL are proper nouns

### Decorative Elements
- **No browser chrome** - Don't add macOS window dots (red/yellow/green)
- **No fake window UI** - These are technical diagrams, not app screenshots
- **No OS emojis** - Use brand icons or CSS shapes instead

### Layout
- **Calculate height before coding** - Sum all sections, must fit canvas
- **Reserve bottom padding** - Minimum 32-48px, content must not touch edge
- **No negative positioning** - `top: -12px` causes clipping
- **Minimum 80px spacing** - Between major elements

### Styling
- **No raw hex colors** - Use brand tokens (gray.400, green.600, etc.)
- **No mixed styles** - This is docs style, don't mix with marketing patterns
- **No inconsistent radii** - Docs uses 6-8px, keep consistent
- **No thick borders** - Docs uses 1px borders, not 2-3px

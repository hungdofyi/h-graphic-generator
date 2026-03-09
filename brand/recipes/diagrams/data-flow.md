# Data Flow Diagram

## When to Use
- ETL pipelines
- Data transformation sequences
- Query execution flows
- Filtering and branching logic

## Required Inputs
- Data sources (name, type)
- Transformations (what happens at each step)
- Outputs (final destinations)
- Any filtering/branching logic

## Components Used

| Element | Component | SVG |
|---------|-----------|-----|
| Data source | nodes/box (default) | svg/diagram-icons/database.svg |
| Transform step | nodes/box (semantic) | - |
| Output | nodes/box (gray-fill) | - |
| Flow line | connectors/straight | - |
| Branch | connectors/branch | svg/connectors/branch-*.svg |
| Step number | nodes/step-indicator (green) | - |

## Construction Steps

1. **Identify flow direction** (typically left-to-right)
2. **Place source nodes** on the left
3. **Add transformation nodes** in the middle
4. **Place output nodes** on the right
5. **Connect with flow lines** (use branch for splits)
6. **Add step numbers** along the flow path
7. **Label each connection** with action/description

## Branching Pattern

For one-to-many flows:
```
        ┌─────► Output A
Source ─┼─────► Output B
        └─────► Output C
```

Use `connectors/branch` component with appropriate variant.

## Step Number Placement
- Place step indicators on connection lines
- Use green variant for main steps
- Use substep format (3.1, 3.2) for parallel branches

## Color Usage
- Source: white background, gray.400 border
- Transform: green.50 background, green.600 border
- Output: gray.200 background, no border
- Connectors: gray.600 (default), green.600 (highlighted path)

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

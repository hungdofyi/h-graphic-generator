# Figma Style Extraction Design

**Date:** 2026-03-05
**Status:** Approved
**Author:** Claude + User

## Overview

Extract brand styles directly from Figma source files using Figma MCP, replacing the need for Gemini Vision-based image analysis for internal brand assets. Generate modular style building blocks for AI-powered graphic generation.

## Goals

1. Extract precise design tokens from Figma (colors, typography, gradients, shadows)
2. Identify composition patterns per graphic category
3. Generate modular building blocks (layouts, color schemes, effects)
4. Enable reference-to-brand generation for external inspiration images
5. Enrich existing `brand.json` with extracted data

## Non-Goals

- Full design system documentation generation
- Real-time Figma sync (manual extraction is sufficient)
- Extracting every graphic (representative samples only)

## Architecture

### Pipeline

```
Figma File (consolidated)
        |
        v
   Figma MCP (extraction)
        |
        v
   Raw JSON Data (brand/extracted/)
        |
        v
   Claude Analysis (pattern recognition)
        |
        +---> brand.json (enriched)
        +---> brand/styles/ (building blocks)
        +---> style-profile.json
```

### Reference-to-Brand Flow (External Images)

```
External Reference Image
        |
        v
   Gemini Vision (concept extraction)
        |
        +---> Layout structure
        +---> Visual concept
        |
        v
   Apply Brand Styles (from Figma extraction)
        |
        v
   On-Brand Output
```

## Figma File Requirements

### Structure

```
holistics-graphics.fig
  +-- Styles (page)              <- Global color/text styles
  +-- Feature Illustrations      <- Category page
  +-- Spot Illustrations         <- Category page
  +-- Docs Graphics              <- Category page
  +-- [Other categories...]
```

### Guidelines

- **5-8 graphics per category** (representative samples)
- **AI-renamed layers** (semantic names, not "Frame 123")
- **Use Figma styles** for colors and typography
- **One page per category** (page name = category key)

## Data Extraction

### Properties to Extract

| Property | Purpose |
|----------|---------|
| fills | Solid colors, linear/radial gradients (stops, angle) |
| effects | Drop shadows, inner shadows, blurs |
| strokes | Color, weight, dash patterns |
| position/size | Absolute x, y, width, height |
| cornerRadius | Per-corner values |
| opacity | Layer and fill opacity |
| blendMode | Overlay effects |

### Sample Structures

**Gradient:**
```json
{
  "type": "GRADIENT_LINEAR",
  "angle": 135,
  "stops": [
    { "position": 0, "color": "#259B6C" },
    { "position": 1, "color": "#05264C" }
  ]
}
```

**Shadow:**
```json
{
  "type": "DROP_SHADOW",
  "color": "rgba(0,0,0,0.15)",
  "offset": { "x": 0, "y": 4 },
  "radius": 12,
  "spread": 0
}
```

## Output Artifacts

### 1. Enriched brand.json

New sections added:
- `colors.gradients` - Common gradient definitions
- `colors.shadows` - Shadow presets (sm, md, lg)
- Precise values from Figma styles

### 2. Modular Style Building Blocks

```
brand/styles/
  +-- layouts/
  |     +-- feature-illustrations/
  |     |     +-- centered-hero.json
  |     |     +-- split-panel.json
  |     |     +-- flow-diagram.json
  |     +-- spot-illustrations/
  |           +-- icon-with-badge.json
  |           +-- floating-elements.json
  +-- color-schemes/
  |     +-- green-dominant.json
  |     +-- blue-dominant.json
  |     +-- light-neutral.json
  |     +-- gradient-hero.json
  +-- effects/
  |     +-- shadows.json
  |     +-- gradients.json
  |     +-- decorative.json
  +-- compositions/
        +-- common-patterns.json
        +-- spacing-rules.json
```

### 3. Raw Extracted Data

```
brand/extracted/
  +-- global-styles.json
  +-- categories/
        +-- feature-illustrations.json
        +-- spot-illustrations.json
        +-- docs-graphics.json
```

### 4. Style Profile

`brand/style-profile.json` - Pattern analysis for AI context

## CLI Commands

```bash
# Extract from Figma
hgraphic figma extract --file-key <KEY> --output brand/extracted/

# Analyze extracted data
hgraphic figma analyze --input brand/extracted/ --output brand/styles/

# Combined operation
hgraphic figma sync --file-key <KEY>

# Generate from external reference
hgraphic generate --reference image.png --category feature-illustration -o output.png
```

## MCP Tools

| Tool | Purpose |
|------|---------|
| `extract_figma_styles` | Pull data from Figma file |
| `get_style_profile` | Get brand patterns (existing, enhanced) |
| `list_layouts` | Browse layouts per category |
| `list_color_schemes` | Browse color scheme options |
| `generate_from_reference` | External image to on-brand graphic |

## Code Changes

### New Files

- `src/core/figma-extractor.ts` - Figma MCP orchestration
- `src/core/style-analyzer.ts` - Claude-based pattern analysis
- `src/cli/commands/figma.ts` - CLI commands

### Modified Files

- `src/core/style-extractor.ts` - Add Figma input path
- `src/mcp/tools/get-style-profile.ts` - Include Figma data
- `brand/brand.json` - New sections for gradients, shadows

## Configuration

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `FIGMA_ACCESS_TOKEN` | For Figma extraction | Figma API authentication |
| `GEMINI_API_KEY` | For reference-to-brand | External image analysis |

### User-Provided API Keys

Gemini Vision features (reference-to-brand) require users to provide their own API key. The CLI should:
1. Check for `GEMINI_API_KEY` env var
2. Prompt with instructions if missing
3. Link to Gemini API key setup docs

## Generation Flow

```
User: "Create a feature illustration about data pipelines"

Claude:
1. get_style_profile() -> brand patterns
2. list_layouts("feature-illustrations") -> pick "flow-diagram"
3. list_color_schemes() -> pick "green-dominant"
4. Generate HTML using building blocks
5. render_graphic() -> PNG output
```

## Iteration Plan

This design will be refined during implementation:
1. Start with baseline extraction properties
2. Run on sample graphics
3. Identify missing/noisy data
4. Adjust extraction spec
5. Repeat until stable

## Success Criteria

- [ ] Figma MCP extracts tokens accurately
- [ ] Claude identifies meaningful patterns across categories
- [ ] Generated graphics match brand style
- [ ] Reference-to-brand produces on-brand outputs
- [ ] CLI commands work end-to-end

## Open Questions

1. Optimal depth for Figma node traversal (start with 3-4)
2. How to handle graphics with multiple artboards
3. Caching strategy for extracted data

---

*This design was created through collaborative brainstorming and approved for implementation.*

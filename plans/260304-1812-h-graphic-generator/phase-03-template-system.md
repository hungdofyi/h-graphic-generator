# Phase 3: Template System

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 5h
<!-- Updated: Validation Session 1 - Templates reworked for landing page + docs use cases -->
- Implement template registry pattern + 4 built-in templates: **feature-illustration**, **process-steps**, **concept-comparison**, **linear-flow**. Plus Mermaid integration for complex diagrams.

## Context Links
- [Design Guidelines](../../docs/design-guidelines.md) — Template Structure, Template Contract
- [Phase 2](phase-02-core-engine.md) — Types, BrandConfig

## Key Insights
- Templates return HTML strings consumed by satori-html -> Satori
- Satori supports subset of CSS: flexbox, basic text, colors, borders, backgrounds
- NO: box-shadow, CSS filters, gradients (limited), transforms, grid
- Templates must use only Satori-compatible CSS
- Each template is self-contained module with metadata + render function

## Requirements

### Functional
- Template registry: register, lookup by name, list all, filter by category
- 4 built-in templates with brand token injection
- Templates accept typed props + BrandConfig -> return HTML string
- Sensible defaults for all optional props

### Non-functional
- Templates must render in < 100ms (HTML generation only)
- Easy to add new templates (just create file + register)

## Related Code Files

### Files to Create
```
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/templates/registry.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/templates/feature-illustration/index.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/templates/process-steps/index.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/templates/concept-comparison/index.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/templates/linear-flow/index.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/mermaid-renderer.ts
```

## Implementation Steps

### 1. Implement registry (src/templates/registry.ts)

```typescript
import type { Template } from '../core/types.js';

class TemplateRegistry {
  private templates = new Map<string, Template>();

  register(template: Template): void {
    this.templates.set(template.name, template);
  }

  get(name: string): Template | undefined {
    return this.templates.get(name);
  }

  list(category?: string): Template[] {
    const all = Array.from(this.templates.values());
    if (!category) return all;
    return all.filter(t => t.category === category);
  }

  has(name: string): boolean {
    return this.templates.has(name);
  }
}

// Singleton
export const registry = new TemplateRegistry();

// Auto-register built-in templates on import
export function registerBuiltinTemplates(): void {
  // Import and register each built-in template
}
```

### 2. Implement feature-illustration template

<!-- Updated: Validation Session 1 - Replaced hero-banner with feature-illustration -->
**Purpose:** Visual representation of a product feature for landing pages and docs. Shows an icon/graphic + title + description in a card layout.
**Default size:** 800x600
**Props:** title (string, required), description (string), icon (string — emoji or SVG path), accentColor (string, override brand secondary)

```typescript
// src/templates/hero-banner/index.ts
import type { Template, BrandConfig } from '../../core/types.js';

export const heroBanner: Template = {
  name: 'hero-banner',
  description: 'Full-width banner with title, subtitle, and optional CTA',
  category: 'marketing',
  defaultSize: { width: 1200, height: 630 },
  props: {
    title: { type: 'string', required: true, description: 'Main heading' },
    subtitle: { type: 'string', required: false, description: 'Subheading text', default: '' },
    ctaText: { type: 'string', required: false, description: 'Call-to-action button text', default: '' },
  },
  render: (props, brand) => {
    // [RED TEAM] All string props must be escaped to prevent HTML injection
    const { escapeHtml } = require('../../core/sanitize.js');
    const title = escapeHtml(String(props.title));
    const subtitle = props.subtitle ? escapeHtml(String(props.subtitle)) : '';
    const ctaText = props.ctaText ? escapeHtml(String(props.ctaText)) : '';
    return `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: ${brand.spacing.scales['2xl']}px; background-color: ${brand.colors.primary.value}; color: ${brand.colors.background.value};">
      <div style="display: flex; font-family: ${brand.typography.display.family}; font-weight: ${brand.typography.display.weight}; font-size: 64px; text-align: center; margin-bottom: ${brand.spacing.scales.md}px;">
        ${title}
      </div>
      ${subtitle ? `<div style="display: flex; font-family: ${brand.typography.body.family}; font-size: 24px; opacity: 0.9; text-align: center;">${subtitle}</div>` : ''}
      ${ctaText ? `<div style="display: flex; margin-top: ${brand.spacing.scales.lg}px; padding: ${brand.spacing.scales.sm}px ${brand.spacing.scales.xl}px; background-color: ${brand.colors.secondary.value}; border-radius: 8px; font-family: ${brand.typography.heading.family}; font-size: 20px;">${ctaText}</div>` : ''}
    </div>
  `;
  },
};
```

### 3. Implement process-steps template

<!-- Updated: Validation Session 1 - Replaced feature-card with process-steps -->
**Purpose:** Numbered step-by-step graphic for how-to guides, onboarding flows, docs pages.
**Default size:** 1200x600
**Props:** steps (array of {number, title, description, icon?}), title (string, optional heading)

Render: Horizontal layout of numbered step cards connected by arrows. Each step has number badge, icon (optional), title, short description. Uses brand colors for numbering and accent.

### 4. Implement linear-flow template

**Purpose:** Simple flowchart/process diagram from structured data.
**Default size:** 1200x800
**Props:** nodes (array of {id, label, type?}), edges (array of {from, to, label?}), title (string)

Render: Horizontally/vertically laid out boxes connected by arrows. Use brand.diagram tokens for node colors, edge color, border radius.

> **[RED TEAM]** Renamed from `diagram-flow`. Constrained to **linear chains only** (no branching/cycles). Validate input: reject edges that create branches or cycles. Max 10 nodes per diagram.

**Note:** This is a simplified linear process renderer — NOT a full diagram tool. For complex graphs, users should use Mermaid or D2.

```typescript
// Simplified approach: render nodes as flex boxes with arrow separators
render: (props, brand) => {
  const nodes = props.nodes as Array<{id: string; label: string}>;
  // Render each node as a styled div, with arrow divs between them
  // Use flexbox row layout for horizontal flow
}
```

### 5. Implement concept-comparison template

<!-- Updated: Validation Session 1 - Replaced social-og with concept-comparison -->
**Purpose:** Before/after, vs comparison, or two-concept side-by-side graphic for landing pages and docs.
**Default size:** 1200x600
**Props:** leftTitle (string, required), leftItems (string[]), rightTitle (string, required), rightItems (string[]), vsLabel (string, default "vs")

Render: Two-column layout with left/right sections separated by a "vs" badge. Each side has title + bullet items. Left uses muted colors, right uses brand primary (suggesting "our approach"). Brand fonts and colors throughout.

### 6. Implement Mermaid renderer (src/core/mermaid-renderer.ts)

<!-- Updated: Validation Session 1 - Added Mermaid integration for complex diagrams -->
**Purpose:** Render Mermaid DSL to branded SVG/PNG using @mermaid-js/mermaid-cli + Puppeteer.

```typescript
export class MermaidRenderer {
  async render(mermaidCode: string, brand: BrandConfig, size?: {width: number; height: number}): Promise<string> {
    // 1. Generate Mermaid theme config from brand tokens (colors, fonts)
    // 2. Write temp .mmd file with mermaid code
    // 3. Call mmdc (mermaid-cli) with --theme custom --cssFile brand.css
    // 4. Read output SVG
    // 5. Cleanup temp files
    // 6. Return SVG string
  }
}
```

Brand CSS injection: Override Mermaid CSS variables with brand tokens:
- `--mermaid-primaryColor` → brand.colors.primary
- `--mermaid-primaryTextColor` → brand.colors.background
- `--mermaid-lineColor` → brand.diagram.edgeColor
- `--mermaid-fontFamily` → brand.typography.body.family

### 7. Register all templates

In `registerBuiltinTemplates()`, import and register all 4 templates.

### 7. Verify templates render valid HTML

Write quick validation: call each template's render() with sample props + brand config, verify non-empty HTML string returned.

## Satori CSS Compatibility Notes

**SAFE to use:**
- display: flex (all flexbox properties)
- width, height, padding, margin
- background-color, color
- font-family, font-size, font-weight
- border, border-radius
- text-align (via flexbox alignment)
- overflow: hidden
- position: absolute/relative
- opacity

**AVOID:**
- display: grid
- box-shadow
- CSS filters (blur, drop-shadow)
- CSS transforms
- CSS transitions/animations
- background: linear-gradient() (limited support)
- text-decoration

## Todo List
- [ ] Implement TemplateRegistry class
- [ ] Implement feature-illustration template
- [ ] Implement process-steps template
- [ ] Implement concept-comparison template
- [ ] Implement linear-flow template
- [ ] Implement Mermaid renderer with brand CSS injection
- [ ] Register all built-in templates in registerBuiltinTemplates()
- [ ] Verify each template renders valid HTML with sample data
- [ ] Export registry from templates module

## Success Criteria
- `registry.list()` returns 4 templates
- Each template renders HTML string when given valid props + brand config
- Templates use only Satori-compatible CSS
- linear-flow handles array of nodes/edges
- All templates properly inject brand tokens (colors, fonts, spacing)

## Risk Assessment
- **Satori CSS limitations**: Templates may render differently than expected
  - Mitigation: Document safe CSS subset, test each template visually
- **linear-flow complexity**: Full diagram layout is hard without a graph library
  - Mitigation: Start with simple linear/branching flow; note as V2 improvement to support complex graphs

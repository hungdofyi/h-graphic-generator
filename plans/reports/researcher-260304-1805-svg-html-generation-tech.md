# SVG & HTML/CSS Graphics Generation Tech Research
**Date:** 2026-03-04 | **Focus:** Production-ready approaches for programmatic graphics

## 1. SVG Generation Libraries

### Satori (RECOMMENDED for HTML→SVG)
- **What:** Converts HTML/CSS to SVG at runtime
- **Pros:** Works headlessly, precise output control, React component support, ideal for dynamic content
- **Cons:** CSS subset support (no shadows/filters), ~1-2s per render, memory intensive
- **Use case:** Social cards, OG images, templates with dynamic data
- **Maturity:** Production-ready (Vercel backing)

### svg.js / Snap.svg
- **What:** Direct SVG DOM manipulation libraries
- **Pros:** Full control, lightweight, good browser support
- **Cons:** Not for template rendering, manual code required
- **Use case:** Custom illustrations, interactive graphics
- **Maturity:** Mature but lower-level

### D3.js
- **What:** Data visualization → SVG
- **Pros:** Excellent for charts/dashboards, powerful data binding
- **Cons:** Steep learning curve, not for static templates
- **Use case:** Analytics, charts, data visualizations
- **Maturity:** Industry standard

## 2. HTML-to-Image Conversion Tools

### Puppeteer/Playwright (BROWSER-BASED)
- **Pros:** Full CSS support, all web features work, high-quality output
- **Cons:** Slow (150-500ms per image), heavyweight (~150MB), memory overhead
- **Performance:** 10-20 images/sec max
- **Use case:** Complex layouts, existing web components
- **Best for:** Low-volume, high-fidelity rendering

### Sharp (IMAGE PROCESSING)
- **What:** Fast image processing, not a renderer
- **Pros:** Ultra-fast transforms, resize/crop/webp
- **Cons:** Requires pre-rendered image input
- **Use case:** Post-processing after Satori/Puppeteer
- **Maturity:** Production-ready, industry standard

### Satori + resvg (OPTIMAL COMBO)
- **Satori:** HTML/CSS → SVG (~100ms)
- **resvg:** SVG → PNG/JPG/WebP (~50ms)
- **Combined:** ~150ms, no browser, low memory
- **Pros:** Fast, scalable, deterministic output
- **Cons:** CSS subset limitations
- **Use case:** Batch generation, serverless functions

## 3. Template Approaches

### React Components + Satori (RECOMMENDED)
- Use React for template logic, Satori renders to SVG
- Tree-shaking removes unused React code
- Props-based dynamic content
- Example: Next.js API route → Satori → PNG

### Handlebars/EJS + SVG Templates
- String-based templates with logic
- Lightweight, predictable output
- Good for static-heavy graphics
- Harder to compose complex layouts

### React PDF Libraries
- **react-pdf:** Create PDF documents as React components
- Useful for PDF-specific output, not ideal for web images

## 4. AI + SVG Generation

### LLM Prompting Strategies
- **SVG code generation:** Works well for simple shapes, icons, diagrams
- **Best prompts:** Specify viewBox, use semantic SVG (not canvas), include color hex values
- **Limitations:** Complex curves, accurate sizing, CSS features beyond basic fills
- **Practical approach:** LLM generates SVG outline, post-process with libraries

### Recommended Workflow
1. LLM generates SVG skeleton
2. Validate with svgdom/jsdom
3. Enhance with svg.js or D3 if needed
4. Export via Sharp/resvg

## 5. Design Token Systems

### Style Dictionary (RECOMMENDED)
- **What:** Amazon-backed tool converting JSON tokens → platform-specific outputs
- **Supports:** CSS, SCSS, JSON, iOS Swift, Android Kotlin
- **Workflow:** tokens.json → build → design-tokens.css
- **Maturity:** Production-ready, industry adoption
- **Pros:** Single source of truth, extensible, build-time generation
- **Cons:** Complex config for advanced use cases

### W3C Design Tokens Spec
- Emerging standard for token format (still draft)
- Format: JSON with type system (color, dimension, typography)
- Not yet tooling standard, but good for documentation

### Implementation Pattern
```
design-system/
├── tokens/tokens.json        (source)
├── config.js                 (Style Dictionary config)
└── build/
    ├── design-tokens.css     (generated)
    └── tokens.js             (generated)
```

## 6. Export Pipeline

### Single Format (Recommended Start)
- **Input:** HTML/React template
- **Process:** Satori → SVG → Sharp (resize)
- **Output:** PNG at multiple sizes (OG 1200x630, thumbnail 400x400)
- **Speed:** <200ms per image, 20+ images/sec

### Multi-Format Pipeline
1. **Source:** Satori output (SVG)
2. **Branching:**
   - PNG: SVG → resvg (fast, vectorized)
   - JPG: PNG → Sharp quality optimization
   - WebP: Same as PNG via Sharp
   - PDF: SVG → pdf-lib or weasyprint
3. **Size variants:** Generate via Sharp transform

### Serverless Optimization
- Cache compiled React components
- Use Satori in Lambda/Vercel Functions
- Pre-warm Sharp/resvg for cold starts
- Stream responses for multi-image exports

## Recommended Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Template | React + Satori | Fast, composable, dynamic data |
| SVG Gen | Satori | Fast, low memory, serverless-friendly |
| Raster | resvg + Sharp | Speed, quality, multi-format |
| Design Tokens | Style Dictionary | Single source, build-time safety |
| Dynamic SVG | D3.js (if needed) | Industry standard for data viz |

## Performance Targets
- Single image: <250ms (Satori 100ms + resvg 50ms + Sharp 50ms)
- Batch (10): <3sec
- Serverless cold start: <5sec

## Unresolved Questions
- **LLM integration complexity:** Needs evaluation for accuracy of generated SVG
- **CSS animation in output:** No standard approach for animated exports
- **Accessibility in generated graphics:** Limited token guidance for accessible output

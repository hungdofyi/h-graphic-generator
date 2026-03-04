# Existing Tools Landscape: Branded Graphic & Diagram Generation

**Date:** 2026-03-04 | **Report:** Existing Tools Research

## 1. DIAGRAM GENERATION TOOLS (CLI/API)

### Mermaid
- **What:** JavaScript-based diagram language; generates flowcharts, sequence, ER, state, class, gitgraph diagrams
- **Pricing:** Open source (MIT)
- **I/O:** DSL input → SVG/PNG output; CLI via mermaid-cli; REST API available
- **Brand support:** No native brand guidelines enforcement; can custom style via CSS
- **Gaps:** Limited control over styling; not designed for marketing graphics; no font/color palette enforcement

### D2
- **What:** Modern diagram language from Terrastruct; flowcharts, sequence, entity-relationship
- **Pricing:** Open source + commercial hosting (d2.dev); free CLI
- **I/O:** D2 DSL → SVG output; powerful CLI; REST API available
- **Brand support:** Theming system exists but minimal enforcement; can embed SVG with custom colors
- **Gaps:** Diagram-only; not for marketing assets; styling still manual

### Graphviz
- **What:** Classic graph visualization engine; DOT language for node/edge diagrams
- **Pricing:** Open source (EPL 1.0)
- **I/O:** DOT syntax → SVG/PNG/PDF; CLI tools (dot, neato, etc.)
- **Brand support:** No brand enforcement; colors/fonts configurable via DOT but limited
- **Gaps:** Old codebase; steep learning curve; not for modern branded graphics

### PlantUML
- **What:** UML diagram generator with many diagram types
- **Pricing:** Open source (GPL)
- **I/O:** PlantUML syntax → PNG/SVG; CLI + online server available
- **Brand support:** Custom skinning possible but cumbersome
- **Gaps:** UML-focused; not for marketing; style customization difficult

---

## 2. BRANDED GRAPHIC GENERATION TOOLS (API-Based)

### Canva API
- **What:** Access Canva's design templates programmatically; returns rendered images
- **Pricing:** Freemium API model; ~$10-20/1000 renders
- **I/O:** Template + data JSON → PNG/PDF output
- **Brand support:** STRONG — built for brand consistency; custom brand kit API enforces colors, fonts, logos
- **Gaps:** Limited to Canva templates; requires design upfront; can't generate arbitrary diagrams; subscription required

### Figma API + Plugins
- **What:** Programmatic design export; Figma plugins for custom generation
- **Pricing:** Paid Figma subscription + custom dev work
- **I/O:** REST API exports designs as PNG/SVG/PDF; plugins can modify designs
- **Brand support:** STRONG — Figma is gold standard for brand management; component libraries, shared styles
- **Gaps:** Expensive per-design; steep learning curve; requires Figma license per user; slow API

### Placid.app
- **What:** Image generation API optimized for marketing; resize, placeholder, text overlays
- **Pricing:** Freemium; $30-300/mo paid tiers
- **I/O:** Template + data → PNG/JPG; simple REST API
- **Brand support:** GOOD — supports color themes, font variables, brand logo placement
- **Gaps:** Template-only; can't generate custom layouts; limited to rectangular images

### Bannerbear
- **What:** Programmatic image generation SaaS; templates + dynamic data
- **Pricing:** Freemium; $25-200/mo paid tiers
- **I/O:** Template + JSON data → PNG/PDF/GIF output
- **Brand support:** GOOD — brand template system, asset library, color/font management
- **Gaps:** Template-dependent; expensive at scale; learning curve for template setup

### Cloudinary
- **What:** Image delivery + transformation SaaS; resize, overlay, text rendering
- **Pricing:** Freemium; $99-999/mo for higher tiers
- **I/O:** REST API for image manipulation; URL-based transformations
- **Brand support:** MODERATE — manual color/watermark overlays; no native brand kit
- **Gaps:** Not designed for design generation; more for CDN; requires manual composition logic

---

## 3. AI-POWERED DESIGN GENERATION

### v0.dev (by Vercel)
- **What:** Claude AI generates React components/apps from text descriptions
- **Pricing:** Free beta + paid tiers planned
- **I/O:** Text prompt → React TSX + HTML → screenshot preview
- **Brand support:** NO — generates generic designs; no brand enforcement
- **Gaps:** Web app focused; not for static graphics; requires React knowledge; no brand customization

### Cursor/Claude Code
- **What:** AI assists code generation; can generate SVG/HTML graphics
- **Pricing:** Cursor subscription + Claude API
- **I/O:** Prompt → Code (SVG/HTML) → Rendered output
- **Brand support:** NO — AI doesn't know your brand guidelines unless you provide them
- **Gaps:** Requires manual prompting; no template system; inconsistent output without strict guidelines

### Screenshot-to-Code Tools
- **What:** Tools like screenshot2html take images → HTML/React code
- **Pricing:** API-based ($5-50/mo) or OSS free
- **I/O:** Image → HTML/React code
- **Brand support:** NO — converts existing designs, doesn't generate branded ones
- **Gaps:** Reverse-engineering only; no brand integration; output quality varies

---

## 4. MCP SERVERS (RELATED)

### Existing MCP Ecosystem
- No dedicated MCP servers for graphic generation found in public registry (as of Feb 2025)
- Some MCP servers exist for code generation (Claude's built-in tools)
- Potential: Could wrap Canva API, Figma API, or Placid.app as MCP server

### MCP Opportunity
- **Gap:** No branded graphic generation MCP server exists
- **Potential:** Build MCP wrapper around Canva/Placid/Bannerbear APIs for Claude integration

---

## 5. OPEN-SOURCE ALTERNATIVES

### Inkscape
- **What:** Desktop vector editor; can be scripted via command line
- **Pricing:** Open source (GPL)
- **I/O:** SVG input → SVG/PNG/PDF output
- **Brand support:** MANUAL — no automation for brand enforcement
- **Gaps:** Desktop tool; not API-driven; slow for batch generation

### LibreOffice Draw + Python
- **What:** Python-UNO bridge to automate LibreOffice Draw
- **Pricing:** Open source
- **I/O:** Python script → ODG → PDF/PNG export
- **Brand support:** NO — requires manual scripting
- **Gaps:** Slow; clunky API; not designed for web

### Pocketbase + Lightweight Template Engine
- **What:** OSS backend + template rendering (Handlebars/EJS) for text-based graphics
- **Pricing:** Open source
- **I/O:** Template + data → HTML/SVG
- **Brand support:** POSSIBLE — if you build it in
- **Gaps:** DIY solution; requires significant engineering

### Excalidraw (draw.excalidraw.com)
- **What:** Open-source hand-drawn diagram/wireframe tool
- **Pricing:** Open source (MIT)
- **I/O:** Excalidraw JSON format; limited API; generates PNG/SVG
- **Brand support:** NO — focused on rough sketching, not branding
- **Gaps:** Sketch-style only; not for polished marketing graphics

---

## KEY FINDINGS

| Category | Best Option | Use Case |
|----------|-------------|----------|
| **Diagrams** | Mermaid (free) / D2 (modern) | Technical diagrams, flowcharts |
| **Branded Marketing** | Canva API (strongest) | Social media, templates |
| **Flexible Templates** | Placid.app / Bannerbear | Batch image generation |
| **AI-Assisted** | Claude + SVG/HTML | Custom design generation |
| **Open-Source** | None standalone; requires DIY | Cost-conscious; full control |

---

## GAPS THIS PROJECT COULD ADDRESS

1. **No branded diagram generation tool** — Canva can't generate diagrams; Mermaid/D2 can't enforce brands
2. **No OSS alternative with brand management** — Most OSS is manual or template-light
3. **No unified API** — No single tool does both diagrams + branded assets + AI generation
4. **No MCP server** — No Claude integration for graphic generation
5. **Brand guideline enforcement** — No tool automatically validates color/font/spacing against brand guidelines

---

## UNRESOLVED QUESTIONS

- Does project need to generate diagrams, marketing graphics, or both?
- Should it be a standalone tool, MCP server, or both?
- Is the target audience technical (devs) or non-technical (marketers)?
- Should it support templates, fully custom generation, or both?
- Price sensitivity: Free/OSS vs. paid APIs acceptable?

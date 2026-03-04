---
title: "h-graphic-generator — CLI + MCP Branded Graphics Tool"
description: "Full implementation plan for TypeScript CLI and MCP server for branded graphic/diagram generation"
status: complete
priority: P1
effort: 31h
branch: main
tags: [typescript, cli, mcp, satori, graphics, branded]
created: 2026-03-04
completed: 2026-03-04
---

# h-graphic-generator Implementation Plan

## Architecture

Hybrid: shared `src/core/` engine consumed by CLI (Commander.js) and MCP server (@modelcontextprotocol/sdk).

## Core Workflow (Validation Session 1, Q7+)
Two input modes, same output:
1. **Sketch → branded graphic**: Marketing provides lo-fi sketch (Excalidraw/whiteboard), Claude analyzes + recreates polished
2. **Prompt → branded graphic**: Marketing describes what they want, Claude generates from scratch

Both: **Claude writes HTML/CSS code → MCP `render_graphic` tool → image file**

Pipeline: HTML/CSS -> Satori (simple) or Puppeteer (complex) -> SVG -> resvg (PNG) -> Sharp (resize/format)

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Project Setup | 3h | complete | [phase-01](phase-01-project-setup.md) |
| 2 | Core Engine (Satori + Puppeteer) | 6h | complete | [phase-02](phase-02-core-engine.md) |
| 2.5 | Style Extraction Pipeline | 4h | complete | [phase-02.5](phase-02.5-style-extraction.md) |
| 3 | Templates + Mermaid | 6h | complete | [phase-03](phase-03-template-system.md) |
| 4 | CLI Interface | 4h | complete | [phase-04](phase-04-cli-interface.md) |
| 5 | MCP Server | 6h | complete | [phase-05](phase-05-mcp-server.md) |
| 6 | Testing | 4h | complete | [phase-06](phase-06-testing.md) |

## Key Dependencies

- Phase 2 depends on Phase 1
- Phase 2.5 depends on Phase 2 (needs BrandContext + types)
- Phase 3 depends on Phase 2 (needs types + engine); can reference Phase 2.5 style profile
- Phase 4 & 5 depend on Phase 2 + 3 (can run in parallel); Phase 5 includes Phase 2.5 MCP integration
- Phase 6 runs after all phases

## Key Decisions

1. **Satori over Puppeteer** — 10x faster, no browser, serverless-friendly
2. **satori-html** for HTML string -> Satori element conversion (Satori does NOT accept raw HTML)
3. **Dual renderer**: Satori (fast, simple CSS) + Puppeteer (full CSS fallback)
4. **Claude generates the code**: MCP serves brand context + component library ref → Claude writes HTML/CSS → tool renders
5. **Templates as examples + shortcuts**: Templates still useful as starting points, but Claude can also generate freeform HTML/CSS
6. **Two input modes**: Sketch image → Claude analyzes → code, OR text prompt → Claude generates → code
4. **JSON brand tokens** — machine-readable, LLM-friendly
5. **Registry pattern** for templates — extensible, discoverable
6. **tsup** for build — fast, ESM output, 3 entry points

## Entry Points

```
dist/cli/index.js    -> bin: "hgraphic"
dist/mcp/server.js   -> MCP stdio server
dist/core/index.js   -> library export
```

## Reports

- [Architecture](../reports/researcher-260304-1805-architecture-approaches.md)
- [Existing Tools](../reports/researcher-260304-1805-existing-tools-landscape.md)
- [SVG/HTML Tech](../reports/researcher-260304-1805-svg-html-generation-tech.md)

## Design Docs

- [Design Guidelines](../../docs/design-guidelines.md)
- [Tech Stack](../../docs/tech-stack.md)

## Red Team Review

### Session 1 — 2026-03-04
**Findings:** 15 (14 accepted, 1 rejected)
**Severity breakdown:** 4 Critical, 5 High, 6 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | HTML injection via template props | Critical | Accept | Phase 2, 3 |
| 2 | outputPath directory traversal | Critical | Accept | Phase 2, 4, 5 |
| 3 | Font loader no offline fallback | Critical | Accept | Phase 1, 2 |
| 4 | tsup shebang poisons all entries | Critical | Accept | Phase 1 |
| 5 | diagram-flow can't handle branching | High | Accept | Phase 3 (renamed linear-flow) |
| 6 | No props validation before render | High | Accept | Phase 2, 4, 5 |
| 7 | MCP reloads brand config every request | High | Accept | Phase 5 |
| 8 | SVG XXE injection | High | Accept | Phase 2 |
| 9 | Arbitrary file read via configPath | High | Reject | Local tool, user has fs access |
| 10 | export_graphic tool redundant | Medium | Accept | Phase 5 (removed) |
| 11 | 5 brand resources should be 1 | Medium | Accept | Phase 5 (kept config only) |
| 12 | CLI tests require pre-built dist/ | Medium | Accept | Phase 6 (use tsx) |
| 13 | Deps scattered across phases | Medium | Accept | Phase 1 (consolidated) |
| 14 | No output directory auto-creation | Medium | Accept | Phase 4, 5 |
| 15 | No dimension caps (DoS risk) | Medium | Accept | Phase 2 |

### Session 2 — 2026-03-04 (Phase 2.5 only)
**Findings:** 13 (11 accepted, 2 rejected)
**Severity breakdown:** 0 Critical, 5 High, 6 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Model ID `gemini-3-flash` → `gemini-3-flash-preview` | Medium | Accept | Phase 2.5 |
| 2 | Path traversal via --references flag | High | Accept | Phase 2.5 |
| 3 | API key leak risk via CLI flag | High | Accept | Phase 2.5 (env-only) |
| 4 | No magic-byte validation on images | High | Accept | Phase 2.5 |
| 5 | SVG not supported by Gemini vision API | High | Accept | Phase 2.5 (rasterize first) |
| 6 | No JSON extraction from LLM response | High | Accept | Phase 2.5 |
| 7 | Prompt injection via SVG content | High | Reject | SVGs rasterized per #5 |
| 8 | No runtime schema validation (Zod) | Medium | Accept | Phase 2.5 |
| 9 | No upper bounds on image count/size | Medium | Accept | Phase 2.5 (100 cap) |
| 10 | Non-atomic file writes | Medium | Accept | Phase 2.5 (tmp+rename) |
| 11 | Sharp not yet a dependency | Medium | Accept | Phase 1 installs Sharp |
| 12 | BrandContext auto-loads style profile | Medium | Accept | Phase 2.5 (explicit load) |
| 13 | No quality gate on vague responses | Medium | Accept | Phase 2.5 (50 char min) |

## Validation Log

### Session 1 — 2026-03-04
**Trigger:** Pre-implementation validation
**Questions asked:** 7

#### Questions & Answers

1. **[Tradeoff]** Satori CSS subset limitation fallback strategy?
   - Options: Accept limits | Add Puppeteer fallback | Use Puppeteer only
   - **Answer:** Add Puppeteer fallback now
   - **Rationale:** Marketing needs full CSS support for complex graphics. Satori for fast/simple, Puppeteer for complex.

2. **[Architecture]** Primary interface — CLI or MCP?
   - Options: MCP primary | CLI first | Both equal
   - **Answer:** MCP server (via Claude) is primary
   - **Rationale:** Marketing team uses Claude Desktop. MCP is the main UX. CLI is secondary for dev/CI.

3. **[Scope]** Linear-flow template vs complex diagrams?
   - Options: Linear-flow fine | Integrate Mermaid | Skip diagrams
   - **Answer:** Use Mermaid for complex diagrams
   - **Rationale:** Marketing needs branching diagrams. Mermaid handles graph layout. Brand CSS injection for consistency.

4. **[Assumptions]** Custom font loading strategy?
   - Options: Local TTF/WOFF2 | Google Fonts CDN | Both
   - **Answer:** Drop TTF/WOFF2 in brand/assets/fonts/
   - **Rationale:** Team has specific brand fonts. File-based is simplest and offline-friendly.

5. **[Architecture]** Browser dependency for Puppeteer?
   - Options: Auto-install Chromium | System Chrome | Playwright
   - **Answer:** Auto-install via puppeteer package
   - **Rationale:** Zero config for marketing team. Chromium auto-downloaded on npm install.

6. **[Scope]** Mermaid brand styling?
   - Options: Inject brand CSS | Mermaid defaults | Custom theme file
   - **Answer:** Yes, inject brand CSS into Mermaid
   - **Rationale:** Brand consistency is core value prop. Override Mermaid defaults with brand colors/fonts.

7. **[Scope]** V1 template types?
   - Options: Hero+OG | All 4 | Hero+Card
   - **Answer:** None of the above — primary use case is landing page illustrations + docs page graphics
   - **Custom input:** "Not hero banner or social OG. Most use case is generate graphic for landing page and docs page — illustrations or static images."
   - **Rationale:** Changes template strategy entirely. Need: feature illustrations, step-by-step process graphics, concept/comparison graphics. Mix of component-based (automatable) and custom.

#### Confirmed Decisions
- Dual renderer: Satori (fast/simple) + Puppeteer (complex CSS) — auto-detect
- MCP-first: Primary interface for marketing. CLI secondary.
- Mermaid integration: For complex diagrams with brand CSS injection
- Local fonts only: brand/assets/fonts/ directory
- Puppeteer: Auto-install Chromium via npm
- Templates reworked: Feature illustration, process-steps, concept-comparison (NOT hero-banner, social-og)

#### Action Items
- [ ] Add Puppeteer as secondary renderer in Phase 2 engine
- [ ] Replace template set: hero-banner → feature-illustration, social-og → concept-comparison, feature-card → process-steps, keep linear-flow
- [ ] Add Mermaid integration to Phase 3 or new phase
- [ ] Update MCP tools to support Mermaid diagram generation
- [ ] Update engine to auto-detect Satori vs Puppeteer based on CSS complexity

#### Impact on Phases
- Phase 2: Add Puppeteer renderer alongside Satori, auto-detect logic
- Phase 3: Complete template rework — new template types for landing/docs graphics
- Phase 5: Add Mermaid diagram MCP tool, update generate_diagram

### Session 2 — 2026-03-04
**Trigger:** User clarified diagram use case — rich visual diagrams (icons + images + styled text), not just Mermaid boxes
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** How designer currently creates diagrams?
   - **Answer:** Figma/design tool

2. **[Scope]** What's minimum AI tool needs to handle?
   - **Answer:** Marketing has lo-fi sketches (Excalidraw/whiteboard), feeds to AI to generate polished branded version. Also can prompt directly.

3. **[Architecture]** What should brand components include?
   - **Answer:** Not just sketch-to-diagram. Marketing can also prompt to generate diagram/graphic directly.

4. **[Architecture]** How should output work?
   - **Answer:** Claude generates HTML/CSS code → tool renders to image

#### Confirmed Decisions (Session 2)
- **Two input modes**: Sketch image OR text prompt → Claude generates HTML/CSS → tool renders
- **Claude is the creative engine**: It analyzes sketches and writes code
- **MCP tool is the rendering engine**: Takes HTML/CSS → image
- **Primary MCP tool: `render_graphic`**: Accepts raw HTML/CSS, renders with brand context
- **Templates become shortcuts**: Pre-built starting points, not the only way to generate
- **brand://config resource expanded**: Includes CSS helpers + component snippets for Claude

#### Impact on Phases
- Phase 5: New primary tool `render_graphic` (HTML/CSS → image). `generate_from_template` wraps templates. brand://config includes CSS helpers + component snippets.
- Phase 3: Templates are still valuable as shortcuts, but the system is now freeform-first

---

## Project Completion Summary

**Status:** COMPLETE (2026-03-04)

All 7 phases delivered and tested. 107 tests passing at 100%.

### CLI Commands Implemented
- `hgraphic render` — Render HTML/CSS to image with brand context
- `hgraphic generate` — Generate graphic from template
- `hgraphic diagram` — Render Mermaid diagram with brand styling
- `hgraphic brand validate` — Validate brand configuration
- `hgraphic brand extract-style` — Extract design tokens from image via Gemini
- `hgraphic templates list` — List available templates

### MCP Tools Delivered
| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| **render_graphic** (PRIMARY) | Render HTML/CSS with brand context | HTML, CSS, theme | PNG/JPG/WebP/SVG image |
| **generate_from_template** | Generate graphic from built-in template | Template name, props | PNG/JPG/WebP/SVG image |
| **list_templates** | Discover available templates | — | Template list with metadata |
| **get_style_profile** | Retrieve extracted design tokens | Image path (optional) | Brand style profile (JSON) |
| **validate_brand** | Validate brand config against schema | Brand config | Validation result |

### Core Engine Components
- **Engine** (Satori-based) — Fast, serverless-friendly SVG generation
- **ExportPipeline** (resvg + Sharp) — Multi-format export (PNG, JPG, WebP, SVG)
- **BrandContext** — JSON-driven brand system with colors, typography, spacing
- **StyleExtractor** — Gemini vision-powered design token extraction from images
- **TemplateRegistry** — 4 built-in templates: feature-illustration, process-steps, concept-comparison, linear-flow
- **MermaidIntegration** — Diagram generation with brand CSS injection

### Security Hardening Applied
- Path traversal protection in outputPath validation
- HTML sanitization via DOMPurify for user-provided content
- SVG sanitization to prevent XXE injection
- XSS prevention in template props validation
- Image magic-byte validation for upload safety
- Dimension caps (max 4000x4000) to prevent DoS
- Environment-only API key handling (no CLI flags)
- JSON schema validation (Zod) for runtime safety

### Test Coverage
- **Total tests:** 107
- **Pass rate:** 100%
- **Categories:** Engine, CLI, MCP, Security, Integration
- **Key coverage:** Render pipeline, brand context, template system, style extraction, security boundaries

### Key Decisions Ratified
1. **Dual renderer:** Satori (default) + Puppeteer (fallback for complex CSS)
2. **MCP-first design:** Rendering engine exposed via MCP for Claude Desktop integration
3. **Claude as creative engine:** Marketing team uses Claude to generate HTML/CSS; MCP renders it
4. **Two input modes:** Sketch image analysis OR freeform text prompts → generated code
5. **Local fonts only:** Brand fonts drop into brand/assets/fonts/ for offline support
6. **Mermaid with brand CSS:** Complex diagrams with brand color/typography injection

### Deployment Status
- All code compiled and optimized via tsup
- Entry points ready: CLI, MCP server, library export
- npm package structure: bin script + dist/ exports
- No environment setup required beyond GOOGLE_GENAI_API_KEY for style extraction

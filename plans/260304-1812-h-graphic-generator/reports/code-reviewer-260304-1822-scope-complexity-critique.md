# Plan Review: Scope & Complexity Critique

**Reviewer:** code-reviewer (Scope & Complexity Critic)
**Date:** 2026-03-04
**Plan:** h-graphic-generator Implementation Plan
**Perspective:** YAGNI enforcer -- over-engineering, premature abstraction, scope creep, gold plating

---

## Finding 1: `export_graphic` MCP tool is redundant scope creep

- **Severity:** High
- **Location:** Phase 5, section "export_graphic tool"
- **Flaw:** `export_graphic` accepts raw SVG strings and converts them to raster formats. This is a generic SVG-to-PNG converter that has nothing to do with branded graphics. No user flow in the plan produces standalone SVG that then needs separate conversion -- `generate_graphic` already handles the full pipeline including export.
- **Failure scenario:** You build and maintain a 5th MCP tool that duplicates ExportPipeline functionality, adds attack surface (SVG injection / XXE per the plan's own security note), and confuses LLMs about which tool to call. You spend time writing tests, docs, and schema for a tool nobody asked for.
- **Evidence:** Phase 5 lists `export_graphic` as a separate tool: "SVG content string to export". The design-guidelines.md describes it as "Export existing SVG to format" -- but no workflow in the plan produces orphaned SVGs needing later export.
- **Suggested fix:** Cut `export_graphic` entirely. If the need arises later, add it. YAGNI.

---

## Finding 2: Five brand resources are over-sliced; one suffices

- **Severity:** High
- **Location:** Phase 5, section "Brand resources"
- **Flaw:** The plan defines 5 separate MCP resources (`brand://config`, `brand://colors`, `brand://typography`, `brand://templates`, `brand://assets`). Four of them are just filtered views of the same JSON object. Each requires its own handler, each calls `BrandContext.load()` independently (no caching shown), and each adds conceptual overhead for the LLM consumer.
- **Failure scenario:** LLM calls `brand://config` and gets the full object anyway. The sub-resources add zero value because the full config is already small (~30 lines JSON). You write and test 5 resource handlers when 1 would serve. Each load() is a redundant filesystem read.
- **Evidence:** `brand://colors` handler: `brand.getConfig().colors` -- this is a single property access on the same object returned by `brand://config`. Same pattern for typography, assets.
- **Suggested fix:** Ship `brand://config` only. Add sub-resources if a real user requests them. The full brand JSON is small enough that slicing adds no benefit.

---

## Finding 3: `diagram-flow` template is under-specified and will deliver poorly

- **Severity:** Critical
- **Location:** Phase 3, section "Implement diagram-flow template"
- **Flaw:** The plan acknowledges "NOT a full Mermaid replacement" and "handles linear flows and simple branching only," yet allocates significant effort to it. Satori's CSS subset forbids transforms, grid, and most positioning tools needed for graph layout. The implementation sketch is "render nodes as flex boxes with arrow separators" -- this cannot handle branching, cycles, or any non-linear topology. The template will produce ugly, broken output for most real diagram inputs, damaging trust in the entire tool.
- **Failure scenario:** User passes `{nodes: [A,B,C,D], edges: [{A->B}, {A->C}, {C->D}]}` (simple branching). Flexbox row layout renders A, B, C, D in a line with arrows between adjacent items -- edges are wrong, layout is meaningless. The "simplified approach" cannot represent edge routing at all.
- **Evidence:** Phase 3: "Simplified approach: render nodes as flex boxes with arrow separators... Use flexbox row layout for horizontal flow." Also: "Satori supports subset of CSS: flexbox, basic text... NO: display: grid, CSS transforms."
- **Suggested fix:** Either (a) cut diagram-flow from MVP and ship 3 templates, or (b) constrain it explicitly to linear-only pipelines (A->B->C) and rename to `pipeline-flow` so expectations are clear. Do not promise "diagram" if you can only render a line.

---

## Finding 4: `diagram` CLI command is a thin wrapper adding no value

- **Severity:** Medium
- **Location:** Phase 4, section "Diagram command"
- **Flaw:** `hgraphic diagram --input data.json` does exactly what `hgraphic generate --template diagram-flow --props-file data.json` would do. It's a convenience alias that duplicates the generate command's logic with a hardcoded template name. This doubles the CLI surface area, doubles the test surface, and creates a maintenance burden -- two code paths that must stay in sync.
- **Failure scenario:** Someone adds a new diagram template variant. Now `hgraphic diagram` is ambiguous -- does it use diagram-flow? diagram-v2? The command is hardcoded to one template and will need rework. Meanwhile `generate -t <name>` already handles template selection generically.
- **Evidence:** Phase 4 diagram command: "Use diagram-flow template with parsed data" -- this is literally `generate -t diagram-flow -p <data>`.
- **Suggested fix:** Cut the `diagram` command. Users use `generate -t diagram-flow --props-file data.json`. If the UX is important, add it as a CLI alias later.

---

## Finding 5: Singleton TemplateRegistry is premature abstraction

- **Severity:** Medium
- **Location:** Phase 3, section "Implement registry"
- **Flaw:** The registry is a singleton class with register/get/list/has/filter methods, plus a `registerBuiltinTemplates()` init function. For 4 hardcoded templates that are known at compile time, this is over-engineered. A plain `Record<string, Template>` or a simple array with a lookup function would be simpler, more testable (no singleton state to reset between tests), and equally extensible.
- **Failure scenario:** Tests that register templates in one test pollute the singleton for subsequent tests. You'll need setup/teardown to clear the registry, adding test complexity for a pattern that buys nothing over a simple object. The "extensible, discoverable" justification from plan.md key decisions is speculative -- no user-defined template loading mechanism is planned.
- **Evidence:** plan.md Key Decision #5: "Registry pattern for templates -- extensible, discoverable." Phase 3: `export const registry = new TemplateRegistry();` (singleton). No plugin system or dynamic template loading is planned anywhere.
- **Suggested fix:** Use a plain `Map` or `Record` initialized with the 4 templates. Export a `getTemplate(name)` function. No class, no singleton. Add a registry class if/when plugin loading becomes a real requirement.

---

## Finding 6: Multi-format output support (JPG, WebP) is gold plating for MVP

- **Severity:** Medium
- **Location:** Phase 2, section "ExportPipeline"; Phase 4, CLI format options
- **Flaw:** The plan supports 4 output formats: SVG, PNG, JPG, WebP. For a branded graphic generator, PNG covers 95%+ of use cases (OG images, presentations, docs). JPG and WebP add Sharp as a dependency (native binary, platform-specific builds), increase test surface (3 extra format tests), and serve no stated user requirement.
- **Failure scenario:** Sharp's native binary fails to install on a CI runner or unusual platform. You spend debugging time on a dependency that serves an edge case. The plan already lists `resvg` for SVG->PNG; Sharp is pulled in solely for JPG/WebP.
- **Evidence:** Phase 2 ExportPipeline: "Sharp (resize/format)" appears in the pipeline for JPG/WebP only. Phase 1 dependencies: `npm install ... sharp`. No user requirement or design doc mentions JPG or WebP as needed formats.
- **Suggested fix:** Ship SVG + PNG only for MVP. Add JPG/WebP as a follow-up if users request it. This removes Sharp as a dependency entirely, simplifying the install and reducing native binary risks.

---

## Finding 7: `--dry-run` and `--json` flags on every command are premature

- **Severity:** Medium
- **Location:** Phase 4, sections "Generate command", "Diagram command", "Brand command", "Templates command"
- **Flaw:** Every CLI command gets `--json` and `--dry-run` flags. `--dry-run` on `brand validate` is meaningless (validate is already read-only). `--json` on `templates list` is engineering for a machine consumer that doesn't exist yet (the MCP server is the machine interface). This is 4x the output formatting work for each command.
- **Failure scenario:** You spend 1-2h implementing JSON formatters and dry-run logic across 4 commands. The `--json` output schema is unspecified, so each command invents its own shape, creating inconsistency. Nobody uses `hgraphic templates list --json` because they use the MCP `list_templates` tool instead.
- **Evidence:** Phase 4 Todo: "Add JSON output mode for all commands", "Add dry-run mode for generate/diagram". No user story or design doc justifies machine-readable CLI output given the MCP server exists for exactly that purpose.
- **Suggested fix:** Implement `--json` and `--dry-run` on `generate` only (the primary command). Skip them on `brand validate`, `templates list`, and `diagram`. Add later if needed.

---

## Finding 8: 27h effort estimate is unrealistically tight given the scope

- **Severity:** High
- **Location:** plan.md, effort summary
- **Flaw:** 27 hours for: TypeScript project setup, core engine with font loading + SVG rendering + multi-format export, 4 templates (including a diagram renderer), full CLI with 4 commands and multiple flags, MCP server with 5 tools and 5 resources, and comprehensive test suite with snapshots. This does not account for: debugging Satori CSS quirks, font loading issues across platforms, MCP SDK API discovery, Sharp native binary issues, or the inevitable iteration on diagram-flow layout.
- **Failure scenario:** At hour 20 you have a working core + CLI but MCP server and tests are incomplete. You rush the MCP implementation, skip edge case tests, and ship with gaps. Or you blow the estimate by 50%, creating schedule pressure downstream.
- **Evidence:** Phase 2 (core engine): 5h. This includes types, font loader with CDN fallback + caching, brand context with validation, Satori rendering with satori-html, export pipeline with 4 formats. 5h for all of that is optimistic even for a senior dev who has used all these libraries before.
- **Suggested fix:** Either (a) cut scope per findings above (remove export_graphic, extra resources, diagram, JPG/WebP) to make 27h realistic, or (b) re-estimate honestly at 40-50h with current scope.

---

## Summary

| # | Finding | Severity |
|---|---------|----------|
| 1 | `export_graphic` MCP tool is redundant | High |
| 2 | 5 brand resources should be 1 | High |
| 3 | `diagram-flow` template will produce broken output | Critical |
| 4 | `diagram` CLI command duplicates `generate` | Medium |
| 5 | Singleton TemplateRegistry is over-engineered | Medium |
| 6 | JPG/WebP support is gold plating | Medium |
| 7 | `--dry-run`/`--json` on every command is premature | Medium |
| 8 | 27h estimate is unrealistic for current scope | High |

**Bottom line:** The plan tries to ship a complete, polished product in V1 instead of an MVP. Cut the diagram template (or constrain to linear-only), drop `export_graphic`, consolidate brand resources, remove JPG/WebP, and simplify CLI flags. This gets you from 27h of rushed work to ~18h of focused, shippable work.

---

## Unresolved Questions

1. Has anyone validated that `satori-html` handles the CSS subset used in these templates? The plan assumes it works but no spike/POC is mentioned.
2. What happens when brand/assets/logo.svg is referenced in a template but Satori can't render embedded SVG images? No plan for asset embedding is described.
3. The font loader falls back to Google Fonts CDN -- is network access acceptable in all deployment contexts (CI, air-gapped, serverless)?

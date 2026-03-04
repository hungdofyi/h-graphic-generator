# Plan Failure Analysis: h-graphic-generator

**Reviewer:** code-reviewer (Failure Mode Analyst)
**Date:** 2026-03-04
**Scope:** All 6 phases of implementation plan

---

## Finding 1: Font Loading Has No Offline Fallback — Engine Will Crash in CI/Serverless

- **Severity:** Critical
- **Location:** Phase 2, section "Implement font-loader (src/core/font-loader.ts)"
- **Flaw:** Font-loader falls back to fetching Inter from Google Fonts CDN. No bundled font. If local fonts dir is empty AND network is unavailable (CI runners, air-gapped servers, serverless cold starts with restricted egress), Satori receives zero fonts and throws a hard crash.
- **Failure scenario:** Developer clones repo, runs `npm run build && node dist/cli/index.js generate ...` in a restricted CI environment. Font-loader finds no local fonts, CDN fetch fails (timeout or blocked), Satori crashes with an unhandled error. No graphic is produced. Every downstream consumer (CLI, MCP) fails.
- **Evidence:** "Falls back to fetching Inter from Google Fonts CDN" and "Satori crashes without fonts" (Phase 2 risk section). No plan step bundles a default font in the npm package or git repo.
- **Suggested fix:** Bundle a small Inter subset TTF (50-100KB) in `brand/assets/fonts/` as part of Phase 1 scaffolding. Font-loader should: local dir -> bundled fallback -> CDN. Never reach a state with zero fonts.

---

## Finding 2: tsup Shebang Banner Poisons All Entry Points

- **Severity:** Critical
- **Location:** Phase 1, section "Configure tsup.config.ts" (step 4)
- **Flaw:** The tsup config applies `banner: { js: '#!/usr/bin/env node' }` globally to ALL entry points. This means `dist/core/index.js` (library) and `dist/mcp/server.js` both get a shebang line. When `core/index.js` is imported as a library by another package, the shebang becomes a syntax artifact. Some bundlers and runtimes choke on it.
- **Failure scenario:** A consumer does `import { Engine } from 'h-graphic-generator'`. The imported `dist/core/index.js` starts with `#!/usr/bin/env node`. Downstream bundlers (webpack, esbuild in strict mode) may emit warnings or errors on the shebang. The MCP server entry also gets an unnecessary shebang.
- **Evidence:** Plan acknowledges this: "banner shebang only needed for CLI entry. Consider separate tsup configs or post-build script" but the implementation step shows the banner applied globally and the mitigation is a comment, not an action item in the Todo list.
- **Suggested fix:** Add a concrete Todo item: create separate tsup configs (one for CLI with shebang, one for core+mcp without). Or use `esbuildOptions` with entry-point filtering. Must be resolved before Phase 1 is marked complete.

---

## Finding 3: MCP Tool outputPath Enables Directory Traversal

- **Severity:** Critical
- **Location:** Phase 5, section "generate_graphic tool" and "export_graphic tool"
- **Flaw:** Both tools accept `outputPath` as a user-supplied string with no validation. The Security Considerations section mentions "validate outputPath to prevent directory traversal" but no implementation step, no validation function, and no Todo item actually implements this.
- **Failure scenario:** An LLM or malicious prompt sends `outputPath: "../../../etc/cron.d/backdoor"` or `outputPath: "/Users/hungdo/.ssh/authorized_keys"`. The tool writes arbitrary content to arbitrary filesystem locations. Since MCP runs as a subprocess with the user's permissions, this is a full file-write primitive.
- **Evidence:** Phase 5 Security Considerations: "File write paths: validate outputPath to prevent directory traversal" — listed as a consideration, absent from implementation steps and Todo list.
- **Suggested fix:** Add a dedicated `validateOutputPath()` utility in Phase 2 that: (1) resolves to absolute path, (2) confirms it's within a configured output directory, (3) rejects paths containing `..`. Call it in every tool/command that writes files. Add as explicit Todo item.

---

## Finding 4: No Input Sanitization on Template Props — XSS/Injection via satori-html

- **Severity:** High
- **Location:** Phase 3, section "Implement hero-banner template" (and all templates)
- **Flaw:** Template render functions interpolate user-supplied props directly into HTML strings via template literals: `${props.title}`, `${props.subtitle}`, etc. No escaping. satori-html parses this HTML. While Satori renders to SVG (not a browser), malicious HTML could break the parser, inject unexpected SVG elements, or cause satori-html to throw.
- **Failure scenario:** User passes `--props '{"title":"<div style=\"position:absolute;width:9999px\">OVERFLOW</div>"}'`. The template injects this raw HTML into the template string. satori-html attempts to parse nested/malformed HTML. At best, layout breaks. At worst, satori-html throws an unhandled parsing error crashing the CLI/MCP server. In SVG output mode, injected elements persist in the SVG file.
- **Evidence:** hero-banner render: `${props.title}` directly interpolated. No `escapeHtml()` or sanitization mentioned anywhere in Phase 3.
- **Suggested fix:** Create an `escapeHtml()` utility (escape `<`, `>`, `&`, `"`, `'`). Apply to all string props before interpolation. Add to Phase 2 as a core utility.

---

## Finding 5: Singleton Template Registry Creates Shared Mutable State

- **Severity:** High
- **Location:** Phase 3, section "Implement registry (src/templates/registry.ts)"
- **Flaw:** Registry is a module-level singleton (`export const registry = new TemplateRegistry()`). In tests, templates registered in one test pollute subsequent tests. In the MCP server (long-running process), if `registerBuiltinTemplates()` is called multiple times (e.g., on reconnect or hot reload), templates get re-registered — potentially with stale references.
- **Failure scenario:** Test suite: test A registers a mock template "test-tmpl". Test B calls `registry.list()` and unexpectedly finds "test-tmpl" in results, causing assertion failure. Tests become order-dependent and flaky. In MCP: server reconnects, calls `registerBuiltinTemplates()` again — Map silently overwrites entries, but any external references to old template objects become stale.
- **Evidence:** `export const registry = new TemplateRegistry();` — singleton. No `reset()` or `clear()` method. Phase 6 tests use this singleton directly.
- **Suggested fix:** Add `registry.clear()` method. Call in `beforeEach` in test setup. For production, add idempotency guard in `registerBuiltinTemplates()` (check if already registered).

---

## Finding 6: MCP Server Loads Brand Config on Every Request — No Caching, Race Conditions

- **Severity:** High
- **Location:** Phase 5, section "Brand resources" (step 7)
- **Flaw:** Every resource handler calls `await BrandContext.load()` independently. Every tool handler also loads brand config. For a single MCP session, brand config is read from disk and parsed N times (once per resource access + once per tool call). If brand.json is modified mid-session, different tool calls see different configs — partial reads of a half-written file cause JSON parse errors.
- **Failure scenario:** User edits brand.json while MCP server is running. Tool call A reads the file mid-write, gets truncated JSON, throws parse error. Tool call B reads the completed file, succeeds. The LLM sees inconsistent behavior. Separately, the Engine loads fonts based on brand config — if config changes between font load and render, font references may be invalid.
- **Evidence:** Phase 5 resource handlers each call `await BrandContext.load()` independently. No shared instance. No caching strategy mentioned.
- **Suggested fix:** Load brand config once at server startup. Store as shared state. Add a `reload_brand` tool or file watcher for explicit refresh. Document that brand config changes require server restart or explicit reload.

---

## Finding 7: CLI Tests Depend on Pre-built dist/ — Brittle and Will Fail

- **Severity:** High
- **Location:** Phase 6, section "CLI command tests" (step 8)
- **Flaw:** CLI tests execute `node dist/cli/index.js`. This requires a successful `npm run build` before tests run. The plan notes this ("CLI tests require build") but the Todo list and vitest config have no build step. If a developer runs `npm test` without building first, all CLI tests fail with "Cannot find module" errors.
- **Failure scenario:** New contributor clones repo, runs `npm install && npm test`. CLI tests all fail because dist/ doesn't exist. Developer assumes tests are broken. In CI, if build step is separate from test step and build fails silently, test step reports misleading failures.
- **Evidence:** Phase 6: "CLI tests require `npm run build` first. Add build step to test script or use `tsx` for direct TS execution." — acknowledged but not resolved. No `"pretest": "npm run build"` in package.json scripts.
- **Suggested fix:** Either: (1) Add `"pretest": "npm run build"` to package.json, or (2) Use `tsx` to run CLI entry directly in tests (bypassing build). Option 2 is better for DX.

---

## Finding 8: No Graceful Degradation for resvg Platform Binary Missing

- **Severity:** Medium
- **Location:** Phase 2, section "Risk Assessment" — "resvg WASM"
- **Flaw:** Plan states "@resvg/resvg-js handles this via optionalDependencies" but resvg-js ships platform-specific native binaries (not WASM). If `npm install` runs on a platform without a prebuilt binary (e.g., Alpine Linux in Docker, uncommon ARM variants), the optional dep silently skips. At runtime, `new Resvg()` throws — but no error handling wraps this in ExportPipeline.
- **Failure scenario:** Docker build on Alpine Linux: `npm install` skips resvg native binary (no prebuilt for musl). Build succeeds. At runtime, `require('@resvg/resvg-js')` throws "Cannot find module". ExportPipeline crashes. All PNG/JPG/WebP exports fail. SVG-only output still works but user has no indication why raster formats fail.
- **Evidence:** Phase 2 ExportPipeline code: `const resvg = new Resvg(svgString, ...)` — no try/catch. Risk section handwaves: "handles this via optionalDependencies."
- **Suggested fix:** Wrap Resvg instantiation in try/catch. If native binary unavailable, throw descriptive error: "Raster export requires @resvg/resvg-js native binary. SVG output is still available. See docs for platform support." Add to Phase 2 implementation steps.

---

## Finding 9: No Output Directory Auto-Creation — File Write Will Fail

- **Severity:** Medium
- **Location:** Phase 4, section "Generate command" (step 2)
- **Flaw:** Default output path is `output/graphic.png`. The `output/` directory is never created in project setup (Phase 1). `fs.writeFile` to a non-existent directory throws `ENOENT`. No `mkdir -p` equivalent exists in the implementation steps.
- **Failure scenario:** User runs `hgraphic generate -t hero-banner -p '{"title":"Test"}'` (using default output path). The `output/` directory doesn't exist. `fs.writeFile('output/graphic.png', buffer)` throws `ENOENT: no such file or directory`. User gets a cryptic Node.js error instead of a helpful message.
- **Evidence:** Phase 4 generate command: `.option('-o, --output <path>', 'Output file path', 'output/graphic.png')`. Phase 1 scaffolding creates `tests/`, `brand/`, `src/` — no `output/`. No `fs.mkdir` call in implementation steps.
- **Suggested fix:** Before `fs.writeFile`, call `fs.mkdir(path.dirname(outputPath), { recursive: true })`. Add as implementation step in Phase 4 generate command and Phase 5 tool handlers.

---

## Finding 10: No Prop Validation Against Template Schema at Runtime

- **Severity:** Medium
- **Location:** Phase 3, section "Template types" (via Phase 2 types.ts) and Phase 4 generate command
- **Flaw:** Templates define `props: Record<string, PropDefinition>` with `required`, `type`, and `default` fields. But no code validates incoming props against this schema. The `render()` function receives raw `Record<string, unknown>` with no type checking, no required-field enforcement, and no default injection.
- **Failure scenario:** User runs `hgraphic generate -t hero-banner -p '{}'` (missing required `title`). Template render function accesses `props.title` which is `undefined`. Output HTML contains literal "undefined" text rendered into the graphic. No error thrown. User gets a graphic with "undefined" as the title.
- **Evidence:** Phase 2 types: `render: (props: Record<string, unknown>, brand: BrandConfig) => string` — no validation. Phase 4 generate command action: "Parse props from --props" — no validation against template.props schema. No `validateProps()` utility anywhere.
- **Suggested fix:** Create a `validateAndApplyDefaults(template: Template, props: Record<string, unknown>)` function that checks required fields, applies defaults, and validates types. Call before every `template.render()`. Add to Phase 2 or Phase 3.

---

## Summary

| # | Severity | Finding |
|---|----------|---------|
| 1 | Critical | No bundled font — engine crashes offline/CI |
| 2 | Critical | Shebang pollutes library + MCP entry points |
| 3 | Critical | Directory traversal via MCP outputPath |
| 4 | High | No HTML escaping in template props |
| 5 | High | Singleton registry — mutable shared state |
| 6 | High | Brand config loaded per-request, race on file change |
| 7 | High | CLI tests require pre-built dist/, not automated |
| 8 | Medium | resvg binary missing = silent runtime crash |
| 9 | Medium | Output directory never created, ENOENT on write |
| 10 | Medium | No prop validation — "undefined" rendered in graphics |

3 Critical, 4 High, 3 Medium. Plan has actionable security gaps (findings 3, 4), reliability gaps (findings 1, 6, 8), and developer-experience issues (findings 2, 5, 7, 9, 10) that will cause failures in production, CI, and testing if not addressed before implementation.

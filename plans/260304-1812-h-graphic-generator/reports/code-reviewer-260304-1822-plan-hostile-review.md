# Plan Hostile Review: h-graphic-generator

Reviewer: code-reviewer | Date: 2026-03-04 | Perspective: Assumption Destroyer

---

## Finding 1: tsup shebang poisons all entry points

- **Severity:** Critical
- **Location:** Phase 1, section "Configure tsup.config.ts" (step 4)
- **Flaw:** The tsup config applies `banner: { js: '#!/usr/bin/env node' }` globally to ALL three entry points (core, cli, mcp). The plan acknowledges this in a comment and risk section but provides no concrete resolution -- just "consider separate tsup configs or post-build script."
- **Failure scenario:** When someone imports `dist/core/index.js` as a library (`import { Engine } from 'h-graphic-generator'`), the shebang `#!/usr/bin/env node` is the first line. Bundlers (webpack, esbuild, Rollup) choke on shebangs in non-entry modules, producing build errors or warnings for every downstream consumer. The MCP server entry also gets an unnecessary shebang that could cause issues in certain subprocess spawn configurations.
- **Evidence:** Plan step 4 code block has `banner: { js: '#!/usr/bin/env node' }` at top level of defineConfig. The note says "Only for CLI entry -- handle via tsup onSuccess or separate config" but this is a comment, not a solution.
- **Suggested fix:** Must use separate tsup configs or `esbuildOptions` per-entry to conditionally apply shebang only to `cli/index`. Provide the actual config, not a TODO comment.

## Finding 2: Font loading silently depends on network access with no offline fallback

- **Severity:** Critical
- **Location:** Phase 2, section "Implement font-loader" (step 2)
- **Flaw:** Font loader "falls back to fetching Inter from Google Fonts CDN." No font is bundled with the package. If the user is offline, in CI without internet, or behind a corporate proxy that blocks Google CDN, Satori will crash because it requires at least one font buffer.
- **Failure scenario:** Developer installs package, runs `hgraphic generate` in a CI pipeline or air-gapped environment. Font fetch fails. Satori throws "No fonts provided" or similar. The tool is completely non-functional without network access on first run.
- **Evidence:** Phase 2 step 2: "Falls back to fetching Inter from Google Fonts CDN" and "Caches loaded fonts in memory" (memory cache is per-process, lost on restart). Phase 2 risk: "Satori crashes without fonts" -- mitigation says "font-loader with fallback to CDN fetch" which IS the problem, not the solution.
- **Suggested fix:** Bundle a small subset font (Inter Regular, ~90KB woff2) in the npm package itself under `assets/fonts/`. Make CDN fetch an optional enhancement, not the fallback.

## Finding 3: diagram-flow template hand-waves the hard part

- **Severity:** High
- **Location:** Phase 3, section "Implement diagram-flow template" (step 4)
- **Flaw:** The plan describes a "simplified approach: render nodes as flex boxes with arrow separators" but provides zero layout algorithm. No handling for: branching (multiple edges from one node), converging flows, cycles, nodes with varying label lengths causing overflow, or what happens when > 8 nodes exceed the 1200px canvas width.
- **Failure scenario:** LLM calls `generate_diagram` with a real-world flow of 12 nodes and 3 branches. The "flexbox row layout" renders all nodes in a single row, overflowing the canvas. Branching edges have no visual representation. Output is a broken, unreadable mess.
- **Evidence:** Phase 3 step 4: "Render each node as a styled div, with arrow divs between them. Use flexbox row layout for horizontal flow." No mention of: wrapping, multi-row layout, branching visualization, max node limits, or truncation strategy.
- **Suggested fix:** Define concrete layout constraints: max nodes per row, wrapping behavior, branching strategy (even if just "linear only, reject branching input with error"). Add input validation that rejects graph structures the renderer cannot handle.

## Finding 4: MCP tool outputPath enables arbitrary file write (directory traversal)

- **Severity:** High
- **Location:** Phase 5, section "generate_graphic tool" (step 2) and "Security Considerations"
- **Flaw:** The plan lists "validate outputPath to prevent directory traversal" in Security Considerations but provides zero implementation detail. The tool schema accepts `outputPath: z.string().optional()` with no validation. Since MCP tools are invoked by an LLM that constructs parameters from user prompts, the LLM could be prompt-injected into writing files to sensitive paths.
- **Failure scenario:** User says "generate a banner and save it." LLM constructs `outputPath: "/etc/cron.d/malicious"` or `outputPath: "../../.ssh/authorized_keys"`. Tool writes arbitrary content to that path. The Security Considerations section acknowledges this but the implementation steps contain no path sanitization code.
- **Evidence:** Phase 5 step 2: `outputPath: z.string().optional().describe('File path to save output')` -- no validation. Security section: "validate outputPath to prevent directory traversal" -- no implementation.
- **Suggested fix:** Add explicit path validation in implementation steps: resolve path, ensure it's within a designated output directory (e.g., `./output/`), reject absolute paths and `..` traversal. Show the validation code inline.

## Finding 5: No props validation before template render

- **Severity:** High
- **Location:** Phase 2 types.ts + Phase 3 template render + Phase 4 CLI generate command
- **Flaw:** Template `render()` accepts `Record<string, unknown>` but no validation occurs between user input and render call. The `PropDefinition` type defines `required` and `type` fields but nothing in the plan validates props against these definitions before calling `render()`.
- **Failure scenario:** User runs `hgraphic generate -t hero-banner -p '{}'` (missing required `title`). Template render function accesses `props.title` which is `undefined`. Output HTML contains literal "undefined" text baked into the SVG. No error thrown, just silently wrong output. Same for type mismatches: passing number where string expected.
- **Evidence:** Phase 3 hero-banner render: `${props.title}` -- no null check. Phase 4 generate command step: "3. Parse props from --props or --props-file" -- no validation step listed. PropDefinition has `required: boolean` and `type` but no validation function exists anywhere in the plan.
- **Suggested fix:** Add a `validateProps(template, props)` function in Phase 2 or 3 that checks required fields exist and types match before calling `render()`. Include it in implementation steps for both CLI and MCP code paths.

## Finding 6: MCP resources reload brand config on every single request

- **Severity:** Medium
- **Location:** Phase 5, section "Brand resources" (step 7)
- **Flaw:** Every resource handler calls `await BrandContext.load()` independently. Five resources means five file reads + JSON parses of the same file if the LLM reads all brand context. No caching, no shared instance.
- **Failure scenario:** LLM starts a generation workflow by reading brand://config, brand://colors, brand://typography, brand://templates, and brand://assets (common pattern). Each triggers a separate `BrandContext.load()` which reads and parses `brand/brand.json` from disk. Five redundant file reads per interaction. Under concurrent MCP requests, this creates unnecessary I/O contention and could return inconsistent data if the file is modified between reads.
- **Evidence:** Phase 5 step 7: Each of the 5 resource handlers contains `const brand = await BrandContext.load();` as its first line. No shared state, no singleton, no caching layer.
- **Suggested fix:** Initialize BrandContext once at server startup. Pass the shared instance to resource handlers. Add a `reload` tool or file-watcher if hot-reload is needed.

## Finding 7: CLI tests assume built dist/ exists but no build step in test pipeline

- **Severity:** Medium
- **Location:** Phase 6, section "CLI command tests" (step 8)
- **Flaw:** CLI tests execute `node dist/cli/index.js` which requires a prior `npm run build`. The plan acknowledges this ("CLI tests require build") but vitest.config.ts has no `globalSetup` or `beforeAll` that runs build. The test:run script is just `vitest run`.
- **Failure scenario:** Developer clones repo, runs `npm test`. CLI tests immediately fail with "Cannot find module dist/cli/index.js". Developer must know to run `npm run build` first. In CI, if build and test are separate steps and someone reorders them, CLI tests silently fail. The plan's own mitigation ("use tsx for direct TS execution") is a different approach than what the test code actually shows.
- **Evidence:** Phase 6 step 8: `const cli = 'node dist/cli/index.js';`. Phase 6 note: "CLI tests require `npm run build` first. Add build step to test script or use `tsx` for direct TS execution." Neither solution is actually implemented in the plan.
- **Suggested fix:** Either add `globalSetup` to vitest.config.ts that runs build, or rewrite CLI tests to use `tsx src/cli/index.ts` directly. Pick one and show it.

## Finding 8: satori-html is listed but not in Phase 1 dependency install

- **Severity:** Medium
- **Location:** Phase 1 step 2 vs Phase 2 step 4
- **Flaw:** Phase 1 installs dependencies: `npm install commander @modelcontextprotocol/sdk satori @resvg/resvg-js sharp`. No `satori-html`. Phase 2 marks satori-html as "CRITICAL" and has a separate `npm install satori-html` buried in step 4. The Phase 1 todo "Install all dependencies" will be marked done without satori-html, then Phase 2 discovers the missing dependency mid-implementation.
- **Failure scenario:** Implementer follows Phase 1, installs deps, marks complete. Starts Phase 2, writes engine code, build fails on `import { html } from 'satori-html'`. Must backtrack to install missing dep. Minor but indicates the dependency audit was incomplete.
- **Evidence:** Phase 1 step 2: `npm install commander @modelcontextprotocol/sdk satori @resvg/resvg-js sharp`. Phase 2 step 4: "Must install `satori-html`" with separate npm install command. Also missing: `zod` (needed by MCP SDK, noted in Phase 5 but not Phase 1), `picocolors` (noted in Phase 4 but not Phase 1).
- **Suggested fix:** Consolidate ALL dependencies into Phase 1 step 2. One install command. No surprise installs in later phases.

## Finding 9: design-guidelines specifies 2x retina PNG default but plan ignores it

- **Severity:** Medium
- **Location:** Phase 2 export-pipeline + Phase 4 CLI defaults vs design-guidelines.md
- **Flaw:** `docs/design-guidelines.md` states: "PNG output at 2x resolution by default for retina displays." The ExportPipeline in Phase 2 has no concept of retina scaling. The CLI defaults in Phase 4 use template's `defaultSize` directly. A 1200x630 template renders a 1200x630 PNG, not the 2400x1260 the design guidelines require.
- **Evidence:** design-guidelines.md line: "PNG output at 2x resolution by default for retina displays." Phase 2 ExportPipeline: `fitTo: size ? { mode: 'width', value: size.width }` -- uses raw size, no 2x multiplier. Phase 4: "Fall back to template's defaultSize" -- no retina mention.
- **Suggested fix:** Add a `scale` option (default: 2 for PNG, 1 for SVG) to RenderOptions. Apply scale multiplier in ExportPipeline when converting SVG to raster. Document the behavior.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 3 |
| Medium | 4 |

The two critical findings (shebang pollution and font loading without offline fallback) will cause the tool to break for basic use cases. The high-severity findings (diagram layout hand-waving, path traversal gap, missing props validation) mean the tool will produce wrong output or be insecure. The plan reads well on the surface but defers hard problems to implementation time with "consider" and "handle" comments instead of concrete solutions.

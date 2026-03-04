# Security Adversary Plan Review

**Reviewer:** code-reviewer (Security Adversary perspective)
**Date:** 2026-03-04
**Target:** h-graphic-generator implementation plan (all 6 phases)

---

## Finding 1: HTML/CSS Injection via Template Props (XSS to SVG Weaponization)

- **Severity:** Critical
- **Location:** Phase 3, "hero-banner template" implementation; Phase 2, `Engine.renderToSvg`
- **Flaw:** Template render functions directly interpolate user-supplied props into HTML strings with zero sanitization. The hero-banner template does `${props.title}` and `${props.subtitle}` directly inside HTML markup. The plan never mentions input sanitization anywhere in the template system.
- **Failure scenario:** An attacker (or LLM via MCP) passes `title: "<img src=x onerror=alert(1)>"` or `title: "</div><script>...</script><div>"`. While Satori may not execute JS, the SVG output embeds the raw content. If the SVG is later opened in a browser or embedded in a webpage, it becomes an XSS vector. More critically, Satori's `satori-html` parser may produce unexpected element trees from malformed HTML, causing crashes or malformed output.
- **Evidence:** Phase 3 hero-banner: `${props.title}` directly in template string. No mention of HTML escaping in Phase 2 or Phase 3.
- **Suggested fix:** Implement mandatory HTML entity escaping for all string props before template interpolation. Create a `escapeHtml()` utility used by every template. Add this as a required step in Phase 2 or Phase 3.

## Finding 2: Arbitrary File Write via outputPath (Directory Traversal)

- **Severity:** Critical
- **Location:** Phase 5, "generate_graphic tool" and "export_graphic tool"; Phase 4, "generate command"
- **Flaw:** The MCP tools accept `outputPath` as a string parameter from the LLM. Phase 5 security section mentions "validate outputPath to prevent directory traversal" but provides zero implementation detail -- no path normalization, no allowlist, no sandbox boundary. The CLI's `--output` flag has the same issue with no validation mentioned.
- **Failure scenario:** LLM sends `outputPath: "../../../../etc/cron.d/malicious"` or `outputPath: "/Users/hungdo/.ssh/authorized_keys"`. The tool writes attacker-controlled binary content to an arbitrary filesystem location. This is a textbook path traversal leading to remote code execution.
- **Evidence:** Phase 5 security section: "File write paths: validate outputPath to prevent directory traversal" -- acknowledged but no implementation plan, no allowlisted directory, no `path.resolve` + prefix check.
- **Suggested fix:** Define an explicit output directory sandbox (e.g., `./output/`). Resolve all paths with `path.resolve()`, then verify the resolved path starts with the sandbox prefix. Reject absolute paths entirely. Add this as a Phase 2 core utility, not just a Phase 5 afterthought.

## Finding 3: Arbitrary File Read via configPath/brandConfigPath

- **Severity:** High
- **Location:** Phase 5, "validate_brand tool" (`configPath` parameter); Phase 4, `--brand <path>` flag; Phase 2, `BrandContext.load(configPath)`
- **Flaw:** `BrandContext.load()` accepts an arbitrary file path and reads + JSON-parses it. The MCP `validate_brand` tool exposes this as `configPath: z.string()` with no path restriction. The CLI exposes it via `--brand <path>`.
- **Failure scenario:** Attacker sends `configPath: "/etc/passwd"` -- the tool reads the file, JSON.parse fails, and the error message leaks file contents or confirms file existence. With `configPath: "/Users/hungdo/.env"` -- if it happens to be valid JSON or the error includes the raw content, secrets are exposed. Even without content leaking, this is an oracle for file existence enumeration.
- **Evidence:** Phase 5 validate_brand: `configPath: z.string().default('brand/brand.json')` with no path validation. Phase 2 `BrandContext.load()`: "Read + JSON.parse + validate schema" with no path boundary.
- **Suggested fix:** Restrict configPath to a known directory (e.g., `brand/`). Validate the path resolves within the project root. Sanitize error messages to never include raw file contents.

## Finding 4: SVG XXE Injection via export_graphic Tool

- **Severity:** High
- **Location:** Phase 5, "export_graphic tool"
- **Flaw:** The `export_graphic` tool accepts raw SVG content as a string parameter and passes it to resvg for rasterization. Phase 5 security section mentions "sanitize to prevent XXE attacks" but provides zero implementation. SVG is XML, and XML parsers are vulnerable to XXE (XML External Entity) attacks by default.
- **Failure scenario:** Attacker sends SVG with `<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>`. If resvg's underlying XML parser processes external entities, local files are read and embedded into the output image or error messages. Even if resvg is safe, the plan does not verify this assumption.
- **Evidence:** Phase 5 security: "SVG input (export_graphic): sanitize to prevent XXE attacks" -- mentioned, not planned. No SVG sanitization library identified, no implementation step.
- **Suggested fix:** Add explicit SVG sanitization step before passing to resvg. Strip DOCTYPE declarations, processing instructions, and external entity references. Use a library like `dompurify` (with jsdom) or write a regex-based strip for DOCTYPE/ENTITY declarations. Document resvg's XXE behavior.

## Finding 5: Font Loading from External CDN (Supply Chain + SSRF)

- **Severity:** High
- **Location:** Phase 2, "font-loader" implementation step 2
- **Flaw:** The font loader falls back to fetching fonts from Google Fonts CDN at runtime. This introduces: (a) supply chain risk -- a compromised CDN serves malicious font files that exploit font parsing vulnerabilities in Satori/resvg; (b) SSRF potential if font URLs are ever user-controllable; (c) availability dependency on external service; (d) data exfiltration -- the CDN sees the server's IP on every cold start.
- **Evidence:** Phase 2 font-loader: "Falls back to fetching Inter from Google Fonts CDN". No integrity check (SRI/hash), no pinned URL, no offline fallback.
- **Suggested fix:** Bundle default fonts as project assets (Inter is MIT-licensed, ~100KB subset). Remove runtime CDN fetch entirely. If CDN fetch is kept, pin the exact URL and verify a SHA-256 hash of the downloaded font buffer.

## Finding 6: No Input Validation on Template Props (Type Confusion)

- **Severity:** High
- **Location:** Phase 3, all templates; Phase 2, `Template.render` type signature
- **Flaw:** Template `render` functions accept `props: Record<string, unknown>`. PropDefinition defines types (string, number, boolean, image) but no validation is implemented or planned. The plan mentions "Sensible defaults for all optional props" but never validates that required props exist or that prop values match declared types.
- **Failure scenario:** Pass `nodes: "not an array"` to diagram-flow template. The template does `props.nodes as Array<{id: string; label: string}>` (Phase 3 line 134) -- a type assertion with no runtime check. This causes a runtime crash (`map is not a function`) or produces garbage output. For the MCP server, this means tool calls fail with unhelpful stack traces instead of actionable error messages.
- **Evidence:** Phase 3 diagram-flow: `const nodes = props.nodes as Array<{id: string; label: string}>` -- unsafe cast. Phase 2 types: `render: (props: Record<string, unknown>, brand: BrandConfig) => string` -- untyped props.
- **Suggested fix:** Add a `validateProps(template, props)` function in Phase 2 that checks required fields exist and values match declared types. Call it before every `template.render()`. Use Zod schemas per template for runtime validation.

## Finding 7: MCP Server Runs Without Authentication or Rate Limiting

- **Severity:** Medium
- **Location:** Phase 5, entire phase
- **Flaw:** The MCP server exposes file-writing, file-reading, and compute-intensive operations (image rendering) with no authentication, no authorization, and no rate limiting. While stdio transport limits exposure to the parent process, the plan mentions no access control model and does not consider what happens if the transport is changed to HTTP/SSE in the future.
- **Failure scenario:** If the server is ever exposed over network (HTTP transport), any client can write arbitrary files (Finding 2), read arbitrary configs (Finding 3), and DoS the server by spamming generate_graphic with large dimensions. Even over stdio, a compromised Claude session could exfiltrate data via the brand resources or write malicious files.
- **Evidence:** Phase 5 architecture shows direct tool -> core engine path with no middleware. No mention of rate limiting, request size limits, or output dimension caps.
- **Suggested fix:** Add maximum dimension limits (e.g., 4096x4096). Add maximum request rate per tool. Document that stdio transport is the only supported transport and add a warning/block if HTTP transport is attempted. Add output file size limits.

## Finding 8: Error Messages Leak Internal Paths and Stack Traces

- **Severity:** Medium
- **Location:** Phase 4, "Error handling" section; Phase 5, validate_brand catch block
- **Flaw:** The plan's error handling returns `error.message` directly to users/LLMs. Node.js error messages for file operations include full filesystem paths. JSON.parse errors can include file content snippets. The MCP validate_brand tool returns `{ valid: false, error: error.message }` with no sanitization.
- **Evidence:** Phase 5 validate_brand: `text: JSON.stringify({ valid: false, error: error.message })`. Phase 4: "Print user-friendly errors" -- good intent but no implementation of path/content stripping.
- **Suggested fix:** Create an error sanitization layer that strips absolute paths, file contents, and stack traces from user-facing error messages. Map internal errors to predefined error codes with safe messages.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 2 |

The plan's biggest systemic weakness: **it acknowledges security concerns in Phase 5's "Security Considerations" section but never schedules implementation of mitigations**. There are no todo items for sanitization, no path validation utilities in Phase 2, and no security testing in Phase 6. The security section is decoration, not a plan.

**Unresolved Questions:**
- Does resvg's XML parser process external entities? The plan assumes no but does not verify.
- What is the maximum image dimension Satori/resvg can handle before OOM? No resource limits defined.
- If brand.json assets reference URLs (e.g., logo URL), does BrandContext fetch them? Potential SSRF vector not addressed.

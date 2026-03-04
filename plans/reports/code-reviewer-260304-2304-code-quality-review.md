# Code Review Report: h-graphic-generator

**Reviewer:** code-reviewer
**Date:** 2026-03-04
**Files Reviewed:** 31 TypeScript files
**LOC:** ~1,500 (core + CLI + MCP + templates)

---

## Overall Assessment

The codebase is **well-structured** with good separation of concerns (core engine, CLI, MCP server, templates). Security measures exist (path traversal prevention, SVG sanitization, dimension limits). However, there are **critical type errors**, **missing path validation in MCP tools**, and a **Puppeteer XSS vulnerability**.

---

## Critical Issues

### 1. XSS Vulnerability in PuppeteerRenderer
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/puppeteer-renderer.ts` (lines 56-68)

HTML is directly embedded into the page content without sanitization:

```typescript
const fullHtml = `
  <!DOCTYPE html>
  <html>
    <body>${htmlString}</body>  // RAW HTML - NO SANITIZATION
  </html>
`;
await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
```

**Impact:** If malicious HTML is rendered via MCP `render_graphic` tool, it could:
- Execute arbitrary JavaScript in Puppeteer context
- Potentially exfiltrate data or perform SSRF via `fetch()`
- Access local resources if sandbox is bypassed

**Recommendation:** Sanitize HTML before Puppeteer rendering or run with stricter CSP headers.

### 2. Missing Path Validation in MCP Tools
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/render-graphic.ts` (line 56)

```typescript
await fs.writeFile(input.output_path, outputBuffer);  // NO PATH VALIDATION
```

The `validateOutputPath()` function from `sanitize.ts` exists but is NOT used. Same issue in:
- `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/tools/generate-from-template.ts` (line 84)

**Impact:** Path traversal attack via `output_path: "../../etc/cron.d/malicious"` could write files anywhere on the filesystem.

**Recommendation:** Apply `validateOutputPath()` to all user-provided output paths:
```typescript
const safePath = validateOutputPath(input.output_path);
await fs.writeFile(safePath, outputBuffer);
```

---

## High Priority

### 3. TypeScript Compilation Errors (Blocking Build)
**Files:** `diagram.ts`, `validate-brand.ts`

6 type errors accessing non-existent properties on `BrandTypography`:
- `fontFamily` (type has `family` not `fontFamily`)
- `fontSize` (does not exist)
- `fontWeight` (type has `weight` not `fontWeight`)

```typescript
// diagram.ts line 69 - WRONG
font-family: ${brand.typography['body']?.fontFamily || 'Inter'}

// SHOULD BE
font-family: ${brand.typography['body']?.family || 'Inter'}
```

**Impact:** Project will not compile. These were likely copy-paste errors or schema drift.

### 4. Missing Input HTML Sanitization
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/engine.ts`

The `renderHtml()` method passes HTML directly to `satoriHtml()` without any sanitization:

```typescript
const markup = satoriHtml(htmlString);  // No sanitization
```

While Satori is safer than Puppeteer (no JS execution), injected styles could cause DoS via CSS bombs (infinite animations, huge dimensions before validation).

**Recommendation:** Add basic HTML/CSS sanitization or style whitelisting for Satori renderer.

### 5. ESLint Not Functional
Missing `typescript-eslint` package prevents linting:
```
Cannot find package 'typescript-eslint'
```

**Recommendation:** Install missing dep: `npm install -D typescript-eslint`

---

## Medium Priority

### 6. Incomplete SVG Sanitization
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/sanitize.ts` (lines 86-97)

```typescript
export function sanitizeSvg(svg: string): string {
  let sanitized = svg.replace(/<!DOCTYPE[^>]*>/gi, '');
  sanitized = sanitized.replace(/<!ENTITY[^>]*>/gi, '');
  sanitized = sanitized.replace(/<!ELEMENT[^>]*>/gi, '');
  return sanitized;
}
```

**Missing:**
- `<script>` tag removal
- `javascript:` URL scheme stripping from `href`/`xlink:href`
- `data:` URL validation
- `<foreignObject>` which can embed arbitrary HTML

**Recommendation:** Use a proper SVG sanitization library (e.g., `DOMPurify` with SVG profile) or expand regex coverage.

### 7. Rate Limit Bypass in GeminiClient
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/gemini-client.ts`

Rate limiting is instance-based, not process/cluster-wide:
```typescript
private lastCallTime = 0;  // Instance variable
```

If multiple `StyleExtractor` instances exist, each has its own rate limit counter.

**Impact:** Low for current usage (single CLI call), but relevant if used as library.

### 8. Missing File Extension Validation on CLI `--file` Input
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/cli/commands/render.ts` (line 43)

```typescript
htmlContent = await fs.readFile(options.file, 'utf-8');
```

No validation that the file is actually HTML. Reading arbitrary files could expose sensitive data if error message includes content.

### 9. Atomic Write Race Condition
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/style-extractor.ts` (lines 300-304)

```typescript
private async atomicWrite(filePath: string, content: string): Promise<void> {
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, content, 'utf-8');
  await fs.rename(tmpPath, filePath);
}
```

If multiple processes write to same file, the `.tmp` suffix is predictable. Consider using `crypto.randomUUID()` for temp file names.

---

## Low Priority

### 10. Unused Parameter
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/puppeteer-renderer.ts` (line 37)

```typescript
_brandConfig?: BrandConfig  // Prefixed with _ but could be used for font loading
```

### 11. Hardcoded Quality Values
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/export-pipeline.ts`

```typescript
.jpeg({ quality: 90 })  // Should be configurable
.webp({ quality: 90 })
```

### 12. Font Loading Error Silently Warned
**File:** `/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/font-loader.ts` (line 46)

```typescript
console.warn(`Failed to load font...`);  // Should bubble up or log more context
```

---

## Positive Observations

1. **Good security foundation:**
   - Path traversal prevention in `sanitize.ts`
   - Dimension validation prevents DoS
   - SVG sanitization (partial but present)
   - API key from env only (not CLI args)

2. **Clean architecture:**
   - Core engine separated from CLI/MCP
   - Template system is well-abstracted
   - Type definitions are comprehensive

3. **Proper error handling:**
   - Try/catch in all commands
   - JSON output mode for machine parsing
   - Meaningful error messages

4. **Zod validation:**
   - MCP tool inputs validated
   - Style profile schemas with relaxed variants

---

## Recommended Actions

1. **CRITICAL:** Add `validateOutputPath()` to MCP tools before write operations
2. **CRITICAL:** Fix TypeScript errors (`fontFamily` -> `family`, remove `fontSize`/`fontWeight`)
3. **HIGH:** Sanitize HTML before Puppeteer rendering or add CSP
4. **MEDIUM:** Expand SVG sanitization to cover `<script>`, `javascript:`, `foreignObject`
5. **LOW:** Install `typescript-eslint` to restore linting

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | ~95% (types defined, some any escapes via `as`) |
| Test Coverage | Unknown (no tests found) |
| Linting Issues | Unable to run (missing dep) |
| Build Status | FAILING (6 type errors) |

---

## Unresolved Questions

1. Is Puppeteer used in production MCP flow, or just Satori? If Puppeteer is gated behind `--renderer puppeteer`, XSS risk is reduced.
2. Should style profile extraction support concurrent extraction (rate limit concern)?
3. Are there plans for test coverage?

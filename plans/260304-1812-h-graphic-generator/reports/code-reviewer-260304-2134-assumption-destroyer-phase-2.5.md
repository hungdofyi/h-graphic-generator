# Assumption Destroyer Review: Phase 2.5 — Style Extraction Pipeline

**Reviewer perspective:** Skeptic — unstated dependencies, false "will work" claims, missing error paths, scale assumptions, integration assumptions.

---

## Finding 1: Gemini 3 Flash Does Not Exist as a Shipping Model Name

- **Severity:** Critical
- **Location:** Phase 2.5, sections "Key Insights", "Implementation Steps #3", "CLI command #5"
- **Flaw:** The plan hardcodes `gemini-3-flash` as the model identifier. Google's Gemini model naming is `gemini-2.0-flash`, `gemini-1.5-flash`, etc. There is no public model called `gemini-3-flash`. The plan treats this as a known, stable identifier.
- **Failure scenario:** Implementation begins, developer installs `@google/genai`, calls `generateContent` with model `gemini-3-flash`, gets a 404 or "model not found" error. Developer wastes time debugging. If this is caught late, it blocks the entire extraction feature.
- **Evidence:** `"Model: gemini-3-flash"` (line 225), `"--model gemini-3-flash"` (line 290)
- **Suggested fix:** Use a verified model ID (e.g., `gemini-2.0-flash-001`). Add a pre-implementation step: "Verify available model IDs via `models.list()` API call or Google AI Studio dashboard."

## Finding 2: SVG Images Cannot Be Analyzed by Gemini Vision API

- **Severity:** High
- **Location:** Phase 2.5, section "Requirements — Functional"
- **Flaw:** The plan lists `svg` as a supported image format for extraction: "Read image files (png/jpg/svg/webp), skip others." Gemini's vision API accepts raster image formats (JPEG, PNG, WebP, GIF, HEIC). SVG is a text-based vector format and is not supported as an inline image input.
- **Failure scenario:** User places SVG reference files in `brand/references/illustrations/`. The extractor reads the SVG file, base64-encodes it, sends it to Gemini. Gemini either rejects it with an error or silently ignores it, producing incomplete analysis for that category. No error handling exists for this case.
- **Evidence:** `"Read image files (png/jpg/svg/webp), skip others"` (line 244, step 4)
- **Suggested fix:** Remove SVG from supported formats. If SVG support is desired, rasterize SVGs to PNG via Sharp/resvg before sending to Gemini — and document this conversion step explicitly.

## Finding 3: No JSON Parse Validation for Gemini Responses

- **Severity:** High
- **Location:** Phase 2.5, section "Implementation Steps #4" (style-extractor.ts)
- **Flaw:** The plan asks Gemini to "Output as JSON" in the prompt, then assumes the response is valid parseable JSON. LLMs frequently return JSON wrapped in markdown code fences (```json ... ```), add trailing commentary, or produce structurally invalid JSON. The plan mentions "Gemini response is parsed as JSON with try/catch" in Security Considerations but provides zero implementation detail for extraction, retry, or fallback.
- **Failure scenario:** Gemini returns `Here is the analysis:\n\`\`\`json\n{...}\n\`\`\`\nLet me know if...`. JSON.parse fails. The catch block... does what? Silently drops the category? Retries? Crashes? The plan does not specify.
- **Evidence:** Per-category prompt ends with `"Output as JSON: { ... }"` (line 265). Synthesis prompt ends similarly (line 282). No JSON extraction logic specified.
- **Suggested fix:** Specify a JSON extraction strategy: (1) strip markdown fences, (2) attempt JSON.parse, (3) on failure, retry with explicit "respond ONLY with valid JSON, no markdown" prompt, (4) after N retries, skip category with warning. Also consider using Gemini's `response_mime_type: "application/json"` parameter to force JSON output.

## Finding 4: Batch Size of 3-5 Images Has No Memory/Token Budget Analysis

- **Severity:** High
- **Location:** Phase 2.5, sections "Requirements — Functional", "Implementation Steps #4"
- **Flaw:** The plan states "Send batches of 3-5 images per request" and "Batch into groups of 3-5 images" without analyzing the token cost. Each high-res image (e.g., 1920x1080 PNG) consumes significant tokens in Gemini's vision API. Gemini Flash has input token limits. 5 high-res images in a single request could exceed the context window or degrade response quality.
- **Failure scenario:** User has reference images at 2000x2000px, 3MB each. Batching 5 of them sends ~15MB of image data in one request. Gemini rejects it (payload too large), times out, or truncates its analysis because it runs out of output tokens covering all 5 images at once.
- **Evidence:** `"Send batches of 3-5 images per request"` (line 26), `"Batch into groups of 3-5 images"` (line 244). Risk Assessment mentions "Large image files" (line 379) but only addresses resize for >2MB, not total batch payload.
- **Suggested fix:** (1) Calculate max per-image size after resize (e.g., 1024px wide, ~500KB). (2) Set batch size based on total payload, not fixed count. (3) Add a `maxBatchSizeMB` config with a conservative default (e.g., 4MB total).

## Finding 5: Sharp Is Claimed as "Already a Project Dependency" — It Is Not

- **Severity:** High
- **Location:** Phase 2.5, section "Risk Assessment"
- **Flaw:** The plan states "Resize images >2MB before sending using Sharp (already a project dependency)." There is no `package.json` in the project yet. Phase 1 (Project Setup) has not been executed. Sharp is planned as a Phase 2 dependency (export pipeline), but at the time Phase 2.5 executes, its availability depends entirely on Phase 2 being complete. The plan treats Sharp as a given without listing it as a dependency of this phase.
- **Evidence:** `"Resize images >2MB before sending using Sharp (already a project dependency)"` (line 380). No package.json exists. Plan overview confirms Phase 2.5 depends on Phase 2.
- **Suggested fix:** Either (1) explicitly list Sharp as a Phase 2.5 prerequisite from Phase 2, or (2) use the `@google/genai` SDK's built-in image handling, or (3) add Sharp to Phase 2.5's install step alongside `@google/genai`.

## Finding 6: Rate Limiter Is Per-Instance, Not Per-Process — Concurrent Runs Will Hit 429

- **Severity:** Medium
- **Location:** Phase 2.5, section "Implementation Steps #3" (gemini-client.ts)
- **Flaw:** The rate limiter tracks `lastCallTime` as an instance variable. If a user runs `extract-style` while another instance is still running (e.g., killed and restarted, or two terminals), both instances independently track their own timing and collectively exceed 10 RPM. The plan also has no lockfile or mutex.
- **Failure scenario:** User runs `extract-style`, it's slow (20+ images at 6.5s each = 2+ minutes). User thinks it hung, Ctrl+C, runs again immediately. Both processes alternate API calls, doubling the rate. 429 errors cascade. Exponential backoff on both instances compounds the problem.
- **Evidence:** `"private lastCallTime = 0;"` (line 201). No mention of process-level coordination.
- **Suggested fix:** Add a lockfile (`brand/.style-extract.lock`) that the CLI checks on startup. If lock exists and process is still running, abort with message. Low effort, prevents the most common concurrent-run scenario.

## Finding 7: Synthesis Prompt Sends All Category Analyses as Text — No Token Limit Check

- **Severity:** Medium
- **Location:** Phase 2.5, section "Implementation Steps #4" (Synthesis prompt)
- **Flaw:** The synthesis step sends all per-category analyses concatenated as text to Gemini. If there are 10 categories, each with multi-paragraph analysis, the synthesis prompt could be very large. No truncation or summarization step exists between per-category analysis and synthesis.
- **Failure scenario:** A thorough brand has 8 categories with 5+ images each. Per-category analysis is 500+ tokens each. Synthesis prompt hits 4000+ input tokens of category summaries plus the instruction prompt. Response quality degrades or output truncates because the model allocates too many tokens to reading input.
- **Evidence:** `"Synthesis prompt (text-only, send all category analyses): {categorySummaries}"` (line 269-282). No mention of summarization or truncation.
- **Suggested fix:** Cap each category summary to ~200 tokens before feeding into synthesis. Or specify in the per-category prompt that the output should be concise (under 150 words per category).

## Finding 8: BrandContext.load() Silently Couples Phase 2 and Phase 2.5

- **Severity:** Medium
- **Location:** Phase 2.5, section "Implementation Steps #6"
- **Flaw:** The plan modifies `BrandContext.load()` from Phase 2 to call `loadStyleProfile()` automatically. This means Phase 2's `BrandContext` — which was designed and tested without style profile awareness — now has a side effect that reads an additional file on every load. Phase 2's success criteria and tests do not account for this. If Phase 2 is already implemented and tested, this modification could introduce regressions.
- **Evidence:** `"Call loadStyleProfile() inside BrandContext.load() after loading brand.json."` (line 324). Phase 2's BrandContext spec (phase-02, line 157-177) has no mention of style profiles.
- **Suggested fix:** Do NOT modify `BrandContext.load()` to auto-load style profile. Instead, expose `loadStyleProfile()` as a separate explicit call. Consumers that need the style profile (MCP server, CLI) call it themselves. This keeps Phase 2 unchanged and follows the Open/Closed principle.

## Finding 9: No Handling for Empty or Low-Quality Gemini Responses

- **Severity:** Medium
- **Location:** Phase 2.5, section "Risk Assessment" and "Implementation Steps #4"
- **Flaw:** The Risk Assessment mentions "Gemini response quality" and suggests "Highly specific prompts" as mitigation. But there is no implementation-level guard for responses that are empty, extremely short, or contain generic filler text ("The graphics use various colors and layouts"). The plan has no quality gate between Gemini's response and writing it to the profile.
- **Failure scenario:** Gemini returns a low-quality response like `{"composition": "standard layout", "colorUsage": "uses brand colors", "elements": "various", "layout": "grid"}`. This gets written to `style-profile.json` and is consumed by templates and MCP. The downstream Claude agent generates graphics based on useless descriptions like "uses brand colors," producing inconsistent output. The user has no signal that extraction quality was poor.
- **Evidence:** `"Gemini response quality: AI may produce vague descriptions"` (line 373). No validation logic, minimum length check, or quality score in implementation steps.
- **Suggested fix:** Add a minimum response length threshold per field (e.g., >20 characters). Log warnings for suspiciously short/generic responses. Optionally, re-prompt once with "Be more specific about X" if response appears generic.

---

**Summary:** 2 Critical, 3 High, 4 Medium findings. The most dangerous assumptions are (1) a non-existent model name that will fail immediately, (2) treating SVG as a vision-compatible format, and (3) no robust JSON extraction from LLM output. The plan also has implicit coupling to Phase 2 internals that could cause integration friction.

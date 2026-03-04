# Phase 2.5: Style Extraction Pipeline

## Overview
- **Priority:** P2 (enhances quality but not blocking core pipeline)
- **Status:** pending
- **Effort:** 4h
- Add CLI command `hgraphic brand extract-style` that analyzes reference graphics via Gemini vision API and produces a structured style profile describing HOW the designer applies brand tokens.

## Context Links
- [Phase 2 — Core Engine](phase-02-core-engine.md) — BrandContext, types.ts
- [Phase 3 — Template System](phase-03-template-system.md) — Templates reference style profile
- [Phase 5 — MCP Server](phase-05-mcp-server.md) — brand://config includes style profile
- [Design Guidelines](../../docs/design-guidelines.md) — Brand Token Format, CLI Commands

## Key Insights
- Style profile captures design *patterns* (how colors are applied, typography hierarchy, spacing rhythm) — NOT the brand tokens themselves (those live in brand.json)
- Maintainer-only tool: run once during repo setup. Teammates never run it.
- Gemini 3 Flash free tier: 10 RPM limit, must batch images and add delays between requests
- Output is both machine-readable JSON (for Claude/MCP) and human-readable Markdown (for designer fine-tuning)
- Per-category analysis + global synthesis pass ensures both specific and holistic style capture

<!-- [RED TEAM] Applied findings from Session 1 (11 accepted) -->
### Red Team Constraints
- **Model ID**: Use `gemini-3-flash-preview-preview` (not `gemini-3-flash-preview`). Accept `--model` CLI flag for easy swap.
- **No SVG input**: Gemini vision API accepts raster only (PNG/JPG/WebP). SVG files must be rasterized via Sharp before sending, or skipped with warning.
- **Path traversal protection**: `--references` dir must resolve within project root. Reject symlinks and paths outside cwd.
- **Magic-byte validation**: Verify file content matches image type (check PNG/JPG/WebP magic bytes). Reject mismatched files.
- **API key env-only**: No `--api-key` CLI flag. GEMINI_API_KEY from env var only — never in shell history.
- **JSON extraction from LLM**: Gemini may wrap JSON in markdown fences. Strip ```json fences, retry parse up to 2x on failure, skip category on 3rd failure with warning.
- **Zod runtime validation**: Validate Gemini response against StyleProfile schema with Zod (already a project dep via MCP SDK). Reject prototype pollution keys.
- **Image count/size caps**: Max 100 images total. Resize images >2MB via Sharp before sending. Warn on skip.
- **Atomic file writes**: Write to `.style-profile.json.tmp` then `rename()` to prevent corruption on crash.
- **BrandContext separation**: Do NOT auto-load style profile in `BrandContext.load()`. Add separate explicit `BrandContext.withStyleProfile()` or require callers to call `loadStyleProfile()` themselves. Phase 2 contract unchanged.
- **Quality gate**: Check Gemini response has minimum 50 chars per field. If response is vague (e.g., "various elements"), retry with more specific prompt. Max 2 retries per category.

## Requirements

### Functional
- Scan `brand/references/` for category subdirectories containing images (png/jpg/webp); rasterize SVGs via Sharp before sending
- Validate references dir is within project root (no traversal, no symlinks)
- Validate image files via magic-byte check (reject non-image files regardless of extension)
- Cap at 100 images total, resize >2MB images via Sharp
- Send batches of 3-5 images per request to Gemini 3 Flash Preview for design analysis
- Produce per-category style analysis (composition, color application, typography, decorative elements)
- Run synthesis pass to extract global patterns across all categories
- Write `brand/style-profile.json` (structured, machine-readable)
- Write `brand/style-profile.md` (human-readable, editable for fine-tuning)
- CLI command with progress feedback and summary output

### Non-functional
- Handle rate limiting: 10 RPM with retry on 429
- Graceful error if GEMINI_API_KEY not set
- Skip categories with no images
- Process 20+ images without hitting rate limits

## Architecture

```
brand/references/
├── illustrations/        <- category subdirs
│   ├── feature-1.png
│   └── feature-2.png
├── diagrams/
│   └── flow-1.png
└── process-graphics/
    └── steps-1.png

        |
        v  hgraphic brand extract-style
        |
   +-----------------------+
   | style-extractor.ts    |
   | 1. Scan categories    |
   | 2. Batch images       |
   +-----------+-----------+
               |
               v
   +-----------------------+
   | gemini-client.ts      |
   | Per-category prompts  |
   | Rate-limited calls    |
   +-----------+-----------+
               |
               v
   +-----------------------+
   | Synthesis prompt      |
   | All categories ->     |
   | Global patterns       |
   +-----------+-----------+
               |
               v
   brand/style-profile.json   <- structured
   brand/style-profile.md     <- human-readable
```

### Integration Points
1. **BrandContext (Phase 2)**: `loadStyleProfile()` loads `brand/style-profile.json` alongside brand.json. Optional — null if file missing.
2. **MCP Server (Phase 5)**: `brand://config` resource includes style profile so Claude references it when generating graphics.
3. **CLI (Phase 4)**: `brand extract-style` subcommand under existing `brand` command group.

### Style Profile Schema

```json
{
  "$schema": "h-graphic-style-v1",
  "extractedFrom": {
    "imageCount": 25,
    "categories": ["illustrations", "diagrams", "process-graphics"],
    "extractedAt": "2026-03-04T21:00:00Z"
  },
  "global": {
    "colorApplication": {
      "primaryUsage": "...",
      "accentUsage": "...",
      "backgroundPatterns": "..."
    },
    "typographyHierarchy": {
      "headingStyle": "...",
      "bodyStyle": "...",
      "emphasisPatterns": "..."
    },
    "spacingRhythm": "...",
    "decorativeElements": ["rounded corners", "subtle shadows"],
    "illustrationStyle": "flat with subtle gradients",
    "overallMood": "professional yet approachable"
  },
  "categories": {
    "illustrations": {
      "composition": "...",
      "colorUsage": "...",
      "elements": "...",
      "layout": "..."
    }
  }
}
```

## Related Code Files

### Files to Create
```
src/core/style-profile-types.ts            # TypeScript types for style profile schema
src/core/gemini-client.ts                   # Thin wrapper around @google/genai for image analysis
src/core/style-extractor.ts                 # Main extraction logic: scan, batch, analyze, synthesize
src/cli/commands/brand-extract-style.ts     # CLI command registration
```

### Files to Modify
```
src/core/brand-context.ts        # Add loadStyleProfile() and getStyleProfile() methods
src/core/types.ts                # Import/re-export StyleProfile types
src/core/index.ts                # Export new modules
src/cli/commands/brand.ts        # Register extract-style subcommand
src/mcp/resources/brand-resources.ts  # Include style profile in brand://config resource
```

## Implementation Steps

### 1. Install @google/genai package

```bash
npm install @google/genai
```

### 2. Define StyleProfile types (src/core/style-profile-types.ts)

```typescript
export interface StyleProfileMetadata {
  imageCount: number;
  categories: string[];
  extractedAt: string;
}

export interface GlobalStyleProfile {
  colorApplication: {
    primaryUsage: string;
    accentUsage: string;
    backgroundPatterns: string;
  };
  typographyHierarchy: {
    headingStyle: string;
    bodyStyle: string;
    emphasisPatterns: string;
  };
  spacingRhythm: string;
  decorativeElements: string[];
  illustrationStyle: string;
  overallMood: string;
}

export interface CategoryStyleProfile {
  composition: string;
  colorUsage: string;
  elements: string;
  layout: string;
}

export interface StyleProfile {
  $schema: string;
  extractedFrom: StyleProfileMetadata;
  global: GlobalStyleProfile;
  categories: Record<string, CategoryStyleProfile>;
}
```

Keep types as string descriptions — the profile is descriptive text, not numeric values. Gemini produces natural language analyses.

### 3. Implement gemini-client.ts (src/core/gemini-client.ts)

Thin wrapper around `@google/genai`:

```typescript
import { GoogleGenAI } from '@google/genai';

export class GeminiClient {
  private client: GoogleGenAI;
  private lastCallTime = 0;
  private minDelayMs = 6500; // ~10 RPM = 1 call per 6s + buffer

  // [RED TEAM] API key from env var only — constructor enforces this
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY env var required. Get one free at https://aistudio.google.com/apikey');
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyzeImages(images: Buffer[], prompt: string, model = 'gemini-3-flash-preview'): Promise<string> {
    await this.rateLimit();
    // Build parts: text prompt + inline image data (base64)
    // Call model with generateContent
    // [RED TEAM] Strip markdown fences from response, parse JSON, retry up to 2x on parse failure
    // Return text response
  }

  private async rateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastCallTime;
    if (elapsed < this.minDelayMs) {
      await new Promise(r => setTimeout(r, this.minDelayMs - elapsed));
    }
    this.lastCallTime = Date.now();
  }
}
```

Key details:
- Model: `gemini-3-flash-preview`
- Images sent as inline base64 (inlineData parts)
- Retry on 429 with exponential backoff (max 3 retries)
- Throw clear error if GEMINI_API_KEY env var missing

### 4. Implement style-extractor.ts (src/core/style-extractor.ts)

Main orchestration logic:

```typescript
export class StyleExtractor {
  constructor(private gemini: GeminiClient) {}

  async extract(referencesDir: string, outputDir: string): Promise<StyleProfile> {
    // [RED TEAM] 0. Validate referencesDir resolves within project root, reject symlinks
    // 1. Scan referencesDir for category subdirs
    // 2. For each category:
    //    a. Read image files (png/jpg/webp), rasterize SVGs via Sharp
    //    b. [RED TEAM] Validate magic bytes (PNG: 89504E47, JPG: FFD8FF, WebP: 52494646)
    //    c. [RED TEAM] Resize images >2MB, cap total at 100 images
    //    d. Batch into groups of 3-5 images
    //    e. Send each batch to Gemini with category-specific prompt
    //    f. [RED TEAM] Strip markdown fences, parse JSON, validate with Zod, retry 2x on failure
    //    g. [RED TEAM] Quality gate: reject responses with <50 chars per field, retry with specific prompt
    //    h. Merge batch results into single category analysis
    // 3. Run synthesis prompt: all per-category analyses -> global patterns
    // 4. Assemble StyleProfile object, validate with Zod
    // 5. [RED TEAM] Write to .style-profile.json.tmp then rename() (atomic)
    // 6. Write style-profile.md (formatted markdown, same atomic write)
    // 7. Return profile
  }
}
```

**Per-category prompt** (send with image batch):
```
Analyze these {category} graphics from a brand design system.
Describe with specificity:
1. Composition and layout patterns (alignment, spacing, visual hierarchy)
2. How colors are applied (not what colors — how they're used for emphasis, backgrounds, accents)
3. Typography hierarchy and text styling patterns
4. Decorative elements (borders, shadows, shapes, icons)
5. Illustration/graphic style (flat, 3D, outlined, gradient usage)

Be specific and actionable — another AI will use this to generate visually consistent graphics.
Output as JSON: { "composition": "...", "colorUsage": "...", "elements": "...", "layout": "..." }
```

**Synthesis prompt** (text-only, send all category analyses):
```
Given these per-category style analyses from a brand's visual design system:
{categorySummaries}

Identify global patterns across all categories:
1. Color application rules (how primary/accent/background colors are used)
2. Typography hierarchy (heading vs body vs emphasis patterns)
3. Spacing rhythm (consistent gaps, padding patterns)
4. Decorative preferences (common decorative elements)
5. Illustration style (overall visual approach)
6. Overall mood/feel

Output as JSON matching this schema:
{ "colorApplication": {...}, "typographyHierarchy": {...}, "spacingRhythm": "...", "decorativeElements": [...], "illustrationStyle": "...", "overallMood": "..." }
```

**Markdown generation**: Convert StyleProfile to readable markdown with sections per category + global summary. Include note that the file is editable for fine-tuning.

### 5. Implement CLI command (src/cli/commands/brand-extract-style.ts)

```bash
hgraphic brand extract-style [--references <dir>] [--output <dir>] [--model gemini-3-flash-preview]
```

- Default references: `brand/references/`
- Default output: `brand/`
- **[RED TEAM] No `--api-key` flag** — env var only
- Progress output: "Analyzing illustrations (5 images)..." per category
- Summary: categories analyzed, image count, output file paths
- Error if GEMINI_API_KEY not set (clear message with setup URL)
- Error if no images found in references dir
- Error if references dir is outside project root

### 6. Update BrandContext (src/core/brand-context.ts)

Add optional style profile loading:

```typescript
// In BrandContext class:
private styleProfile: StyleProfile | null = null;

async loadStyleProfile(): Promise<StyleProfile | null> {
  const profilePath = path.join(path.dirname(this.configPath), 'style-profile.json');
  try {
    const content = await fs.readFile(profilePath, 'utf-8');
    this.styleProfile = JSON.parse(content) as StyleProfile;
    return this.styleProfile;
  } catch {
    return null; // File doesn't exist — style profile is optional
  }
}

getStyleProfile(): StyleProfile | null {
  return this.styleProfile;
}
```

**[RED TEAM]** Do NOT call `loadStyleProfile()` inside `BrandContext.load()`. Keep Phase 2 contract unchanged. Callers that need style profile (MCP server) call `loadStyleProfile()` explicitly after `BrandContext.load()`.

### 7. Update MCP brand resource (src/mcp/resources/brand-resources.ts)

Include style profile in `brand://config` response when available:

```typescript
const config = brandContext.getConfig();
const styleProfile = brandContext.getStyleProfile();

return {
  brand: config,
  ...(styleProfile && { styleProfile }),
};
```

This gives Claude access to style patterns when generating HTML/CSS for graphics.

### 8. Update barrel exports (src/core/index.ts)

```typescript
export { GeminiClient } from './gemini-client.js';
export { StyleExtractor } from './style-extractor.js';
export * from './style-profile-types.js';
```

## Todo List
- [ ] Install @google/genai package
- [ ] Define StyleProfile TypeScript types + Zod schema in style-profile-types.ts
- [ ] Implement gemini-client.ts (env-only API key, rate limiting, retry, JSON fence stripping)
- [ ] Implement image validation utils (magic-byte check, path traversal guard, SVG rasterization)
- [ ] Implement style-extractor.ts (scan, validate, batch, analyze, quality gate, synthesis, atomic write)
- [ ] Generate style-profile.md (human-readable markdown from StyleProfile)
- [ ] Implement brand-extract-style.ts CLI command (no --api-key flag, progress output)
- [ ] Update BrandContext with explicit loadStyleProfile() (not auto-loaded)
- [ ] Update MCP brand resource to include style profile in brand://config
- [ ] Update core/index.ts barrel exports
- [ ] End-to-end test: extract style from sample images, verify JSON + MD output

## Success Criteria
- `hgraphic brand extract-style` reads images from `brand/references/`, calls Gemini, writes both output files
- `brand/style-profile.json` contains structured per-category + global style analysis matching schema
- `brand/style-profile.md` is human-readable, includes editability note
- BrandContext loads style profile alongside brand.json without error when file exists
- BrandContext returns null gracefully when style-profile.json is missing
- MCP `brand://config` resource includes style profile when available
- Rate limiting handles 20+ images without 429 errors
- Clear error message when GEMINI_API_KEY is not set

## Risk Assessment
- **Gemini response quality**: AI may produce vague descriptions instead of actionable patterns
  - Mitigation: Highly specific prompts requesting JSON output with concrete descriptions. Include examples of desired specificity in prompt.
- **Rate limiting on free tier**: 10 RPM cap
  - Mitigation: Built-in 6.5s delay between calls + exponential backoff retry on 429 (max 3 retries)
- **API key requirement**: Maintainer must have GEMINI_API_KEY from Google AI Studio
  - Mitigation: Clear error message with setup URL. Document in project README.
- **Large image files**: Reference PNGs may exceed 5MB / Gemini upload limits
  - Mitigation: Resize images >2MB before sending using Sharp (already a project dependency). Log warning when resizing.
- **Style profile staleness**: Designer evolves style over time
  - Mitigation: Re-run `extract-style` anytime. Output files are gitignored by default — user decides whether to commit.
- **Gemini model availability**: gemini-3-flash-preview may not exist or be renamed
  - Mitigation: Accept `--model` CLI flag with default. Easy to swap model string.

## Security Considerations
- GEMINI_API_KEY stored in env var only, never committed to git. Add to .gitignore / .env.example.
- Reference images sent to Google API — document that free tier may use images for model training (Google AI Studio ToS caveat)
- `brand/references/` can optionally be added to .gitignore if images are proprietary
- No arbitrary file access — references dir is validated to be within project root
- Gemini response is parsed as JSON with try/catch — malformed responses don't crash

## Next Steps
- Phase 3 (Templates): Template design can reference style profile for consistent visual patterns
- Phase 5 (MCP): Integration already covered in steps 6-7 above
- Future: Add `--watch` mode to re-extract when reference images change (YAGNI for now)

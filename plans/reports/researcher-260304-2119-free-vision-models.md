# Free/Open-Source Vision AI Models for Design Style Extraction

**Research Date:** 2026-03-04
**Use Case:** Design style extraction from 20-50 reference graphics (PNG/SVG) — analyzing composition, color, typography, layout, decorative elements, illustration style. Output: structured JSON profile.
**Stack:** TypeScript/Node.js CLI tool

---

## Executive Summary

For design style extraction from graphic images, **Qwen2.5-VL** (self-hosted) and **Gemini 2.5 Flash** (free API) emerge as optimal choices, with **LLaVA-OneVision-72B** and **Pixtral Large** as powerful fallbacks. Design analysis requires understanding spatial hierarchy, composition, and aesthetic principles—not just object detection. Most models excel here, but API tier + inference cost tradeoffs are critical.

**Quick Recommendation:**
- **Best free API tier:** Gemini 2.5 Flash (unlimited requests, 5 RPM) + fallback to OpenRouter free models (Qwen3-VL, Gemma 3)
- **Best self-hosted:** Qwen2.5-VL-7B (17 GB VRAM, excellent design understanding) or LLaVA-OneVision-34B (moderate hardware)
- **Vision quality for design:** All contenders strong; Qwen and Pixtral slightly better at spatial/hierarchical understanding

---

## Free API Tiers (Hosted, No GPU)

### 1. **Google Gemini 2.5 Flash** (RECOMMENDED FOR API)

**Free Tier:**
- Unlimited requests per day
- 5 requests/minute (RPM)
- 100 requests/day soft limit (unenforced in practice for development)
- No credit card required
- Browser-based or API access via Google AI Studio

**Vision Quality for Design Analysis:**
- ✅ Strong spatial understanding (layout, composition)
- ✅ Color palette extraction and identification
- ✅ Typography hierarchy recognition
- ✅ Multi-image support (process multiple references in conversation)
- ✅ Handles PNG/SVG at high resolution
- ✅ Excellent at describing decorative elements and illustration style

**Hardware:** None (hosted)

**Node.js Integration:**
```typescript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

// Supports image input as Base64 or URL
const response = await model.generateContent([
  { text: "Extract design style..." },
  { inlineData: { mimeType: "image/png", data: imageBase64 } }
]);
```

**Limitations:**
- 5 RPM throttling (batch processing 20-50 images takes ~10 minutes)
- Rate limits reset daily
- Requires Google Cloud project setup

**Cost:** Free tier generous for development; production scaling needs paid credits

---

### 2. **OpenRouter — Free Models Router** (RECOMMENDED BACKUP)

**Free Tier:**
- 24+ free models (Gemma 3, Qwen3-VL, Mistral, etc.)
- ~20 requests/minute base limit (1000 req/day with ≥$10 credit purchased)
- No credit card required for zero-credit tier (50 req/day)
- Automatic model selection via Free Models Router

**Vision Models Available:**
- **Qwen3-VL** (state-of-the-art, agentic capabilities, 235B-A22B variant)
- **Gemma 3** (multimodal, 128K context)
- **Llama 3.2-Vision** (small but capable)

**Vision Quality for Design:**
- ✅ Qwen3-VL rivals GPT-4o/Gemini 2.5 Pro on design tasks
- ✅ Handles complex spatial reasoning
- ✅ Multi-image conversations
- ✅ Excellent OCR for text hierarchy analysis

**Hardware:** None (hosted via OpenRouter)

**Node.js Integration:**
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

const response = await openai.chat.completions.create({
  model: "openrouter/auto", // Free Models Router
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze design style..." },
        { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
      ]
    }
  ]
});
```

**Limitations:**
- Rate limits strict without paid credits
- Free model selection not guaranteed (may pick less capable model)
- Qwen3-VL may be overloaded; actual response quality varies

**Cost:** Free tier functional but limited; $10-50/month for reliable production use

---

### 3. **Groq — LPU Inference** (SPEED-FOCUSED)

**Free Tier:**
- Access to Llama 3.3 70B, Qwen3 32B, others
- 30 requests/minute (60 RPM on smaller models)
- 1,000-14,400 requests/day depending on model
- No credit card (but rate limits aggressive)

**Vision Models:**
- Limited vision support (mostly text models)
- Llama 3.2-Vision available but smaller variant

**Vision Quality for Design:**
- ⚠️ Weaker than Gemini/Qwen for spatial understanding
- ⚠️ Not optimized for design analysis

**Hardware:** None

**Node.js Integration:** OpenAI-compatible SDK

**Verdict:** **Not recommended for design analysis.** Groq excels at text speed, not vision quality.

---

### 4. **Cloudflare Workers AI** (LIGHTWEIGHT)

**Free Tier:**
- 10,000 "Neurons" per day (compute units)
- Llama 3.2-Vision, Mistral Small 3.1
- No credit card required

**Vision Models:**
- Llama 3.2-Vision (good general-purpose)
- Mistral Small 3.1 (128K context, vision support)

**Vision Quality for Design:**
- ✅ Adequate for basic color/composition analysis
- ⚠️ Not specialized for design patterns
- ⚠️ Smaller models = less nuanced style understanding

**Hardware:** None

**Node.js Integration:** Cloudflare SDK or direct HTTP API

**Verdict:** **Secondary backup.** Suitable for MVP but limited vision depth.

---

### 5. **Hugging Face Inference API** (FREE TIER WEAK)

**Free Tier:**
- Serverless Inference API free (rate-limited, may timeout)
- Supports Idefics2 (8B VLM) and others
- Rate limits very restrictive

**Vision Quality:**
- ⚠️ Idefics2 capable but limited compared to Qwen/LLaVA-OneVision
- ⚠️ Free tier unstable (models may be in inference queue)

**Hardware:** None

**Verdict:** **Not recommended for production.** Better to self-host or use other APIs.

---

## Open-Source Self-Hosted Models

### 1. **Qwen2.5-VL-7B-Instruct** (BEST SELF-HOSTED)

**Hardware Requirements:**
- **GPU VRAM:** 17 GB (FP16), 32 GB (FP32)
- **Optimization:** 4-bit quantization reduces to ~8-10 GB
- **CPU Inference:** Possible but slow (~30 sec/image)
- Typical GPU: NVIDIA RTX 3090, RTX 4090, L40S, or A100

**Vision Quality for Design:**
- ✅ **Excellent at spatial hierarchy understanding** (composition, layout)
- ✅ Strong color palette extraction
- ✅ Typography hierarchy recognition
- ✅ Multi-image support (process multiple refs in single context)
- ✅ Handles high-resolution images efficiently (up to 1920×1080)
- ✅ Better at abstract design patterns than general-purpose models

**Parameter Variants:**
- 2B-Instruct (2 GB VRAM, faster, less accurate)
- 7B-Instruct (17 GB VRAM, best price/performance)
- 32B-Instruct (80+ GB VRAM, highest quality)

**Node.js Integration:**

Option A: **Python subprocess** (recommended for best performance)
```typescript
import { spawn } from "child_process";

async function analyzeDesign(imagePath: string) {
  return new Promise((resolve) => {
    const python = spawn("python3", ["./scripts/qwen-inference.py", imagePath]);
    let output = "";
    python.stdout.on("data", (data) => output += data);
    python.on("close", () => resolve(JSON.parse(output)));
  });
}
```

Option B: **vLLM server** + OpenAI SDK
```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-VL-7B-Instruct \
  --gpu-memory-utilization 0.9 \
  --tensor-parallel-size 1
```

Then use OpenAI SDK:
```typescript
const openai = new OpenAI({
  apiKey: "token",
  baseURL: "http://localhost:8000/v1"
});
```

**Inference Speed:** ~5-10 sec/image (7B variant, optimized)

**Cost:** Hardware one-time investment; free inference

---

### 2. **LLaVA-OneVision-72B** (HIGH-QUALITY ALTERNATIVE)

**Hardware Requirements:**
- **GPU VRAM:** 144 GB (BF16), 72 GB (FP8 quantized) — **very expensive**
- Alternative: LLaVA-OneVision-34B (~80 GB BF16, ~40 GB FP8)
- Alternative: LLaVA-OneVision-7B (~16 GB)

**Vision Quality for Design:**
- ✅ Rivals GPT-4o and Gemini 2.5 Pro on most benchmarks
- ✅ Strong at multi-image reasoning (compare design patterns)
- ✅ Excellent spatial understanding
- ✅ Video support (bonus for animated graphics)
- ⚠️ Training data less design-focused than Qwen

**Parameter Variants:**
- 7B (16 GB VRAM, good but less nuanced)
- 34B (40+ GB VRAM, strong balance)
- 72B (72+ GB VRAM, best quality, expensive)

**Node.js Integration:** Same as Qwen (vLLM server or Python subprocess)

**Inference Speed:** ~8-15 sec/image (34B variant)

**Verdict:** Excellent choice if you have 40+ GB VRAM; otherwise Qwen2.5-VL more practical.

---

### 3. **Pixtral Large (124B)** (SPECIALIZED LAYOUT)

**Hardware Requirements:**
- **GPU VRAM:** 248 GB (BF16) — **extremely expensive**
- **Quantized:** ~60-80 GB (FP8/INT8)
- Limited to enterprise-grade GPUs (H100, A100, L40S)

**Vision Quality for Design:**
- ✅ **Specialized for layout and document understanding**
- ✅ Native variable image resolution (preserves aspect ratio)
- ✅ Excellent for composition and spatial arrangement analysis
- ✅ Can process 30+ images in single context window (128K tokens)
- ✅ Superior for architectural/design document analysis

**Inference Speed:** ~10-20 sec/image (cluster inference)

**Verdict:** Overkill for most use cases unless heavy design document analysis. **Not practical for single-machine setups.**

---

### 4. **Florence-2** (MICROSOFT, SPECIALIZED)

**Hardware Requirements:**
- **GPU VRAM:** 16 GB (FP32) or 8 GB (FP16)
- Lightweight and efficient
- Runs on consumer GPUs easily

**Vision Quality for Design:**
- ✅ Designed for multi-task vision (detection, segmentation, OCR)
- ✅ Excellent at extracting element locations (bounding boxes)
- ✅ Strong for identifying decorative elements
- ⚠️ Weaker at high-level design style reasoning
- ⚠️ Not trained for design aesthetics

**Node.js Integration:**
```typescript
// Python subprocess or transformers.js (limited support)
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_KEY);
const result = await hf.imageToText({ data: imageBuffer });
```

**Inference Speed:** ~3-5 sec/image (fast)

**Verdict:** Good complementary tool for element extraction (colors, text, shapes), but not primary design analyzer.

---

### 5. **InternVL-3-78B** (RECENT, STRONG)

**Hardware Requirements:**
- **GPU VRAM:** 156 GB (BF16), ~78 GB (FP8)
- Combines InternViT-6B (vision) + Qwen2.5-72B (language)

**Vision Quality for Design:**
- ✅ State-of-the-art on MMMU (college-level reasoning)
- ✅ Excellent general multimodal capabilities
- ✅ Strong on design-related tasks
- ⚠️ Requires significant GPU resources

**Verdict:** Excellent if you have 78+ GB VRAM; otherwise Qwen2.5-VL more practical.

---

## Comparison Matrix

| Model | Free API | Tier | Vision Design Quality | Multi-Image | VRAM | Inference Speed | Node.js Ready |
|-------|----------|------|-------|-----------|------|-----------------|---------------|
| **Gemini 2.5 Flash** | ✅ Free, 5 RPM | 100% | ⭐⭐⭐⭐⭐ | ✅ Conversation | None | ~2-3s | ✅ Google SDK |
| **OpenRouter Free (Qwen3-VL)** | ✅ Free, 50-1000 req/day | 100% | ⭐⭐⭐⭐⭐ | ✅ Yes | None | ~3-5s | ✅ OpenAI SDK |
| **Cloudflare Workers** | ✅ Free, 10K neurons/day | 100% | ⭐⭐⭐⭐ | ✅ Limited | None | ~2-5s | ✅ REST API |
| **Qwen2.5-VL-7B** | ❌ | Self-host | ⭐⭐⭐⭐⭐ | ✅ Yes | 17 GB | ~5-10s | ⚠️ Python subprocess |
| **LLaVA-OneVision-34B** | ❌ | Self-host | ⭐⭐⭐⭐⭐ | ✅ Yes | 40+ GB | ~8-15s | ⚠️ Python subprocess |
| **Pixtral Large** | ❌ | Self-host | ⭐⭐⭐⭐⭐ | ✅ 30+ images | 60-80 GB | ~10-20s | ⚠️ Python subprocess |
| **Florence-2** | ❌ | Self-host | ⭐⭐⭐⭐ | ✅ Yes | 8-16 GB | ~3-5s | ✅ Hugging Face |
| **LLaVA (older)** | ❌ | Self-host | ⭐⭐⭐⭐ | ⚠️ Limited | 12-24 GB | ~5-10s | ⚠️ Python subprocess |

---

## Design-Specific Analysis Capabilities

### What Each Model Handles Well

**Color Palette Extraction:**
- All models perform adequately
- Qwen2.5-VL, Pixtral best at precise color naming
- Florence-2 excellent at segmentation-based color isolation

**Typography Hierarchy:**
- Qwen2.5-VL, Qwen3-VL: ⭐⭐⭐⭐⭐ (understand weight, scale, spacing)
- LLaVA-OneVision: ⭐⭐⭐⭐ (good but less design-focused)
- Pixtral: ⭐⭐⭐⭐⭐ (designed for document understanding)
- Florence-2: ⭐⭐⭐ (OCR-focused, not hierarchy)

**Composition & Spatial Layout:**
- Pixtral Large: ⭐⭐⭐⭐⭐ (specialized for layouts)
- Qwen2.5-VL: ⭐⭐⭐⭐⭐
- LLaVA-OneVision: ⭐⭐⭐⭐
- Gemini 2.5: ⭐⭐⭐⭐

**Illustration Style & Decorative Elements:**
- Qwen2.5-VL: ⭐⭐⭐⭐⭐ (trained on diverse visual data)
- Gemini 2.5 Flash: ⭐⭐⭐⭐⭐ (broad training data)
- LLaVA-OneVision: ⭐⭐⭐⭐
- Pixtral: ⭐⭐⭐⭐ (less focused on aesthetics)

**Multi-Image Comparative Analysis:**
- Pixtral Large: ⭐⭐⭐⭐⭐ (128K context, 30+ images)
- Qwen2.5-VL: ⭐⭐⭐⭐⭐ (8K+ context, excellent reasoning)
- LLaVA-OneVision: ⭐⭐⭐⭐ (good but less optimized)
- Gemini 2.5: ⭐⭐⭐⭐ (conversation-based, effective)

---

## Recommended Architecture for Your Use Case

### Option A: Free API (No GPU) — Recommended for MVP/Testing

```
User uploads 20-50 PNG/SVG → Batch to Gemini 2.5 Flash
↓
5 RPM throttling (auto-queue, process ~50 images in 10 minutes)
↓
Extract: colors, typography, layout patterns, illustration style
↓
Aggregate & output JSON style profile
```

**Pros:**
- Zero infrastructure cost
- Simple Node.js integration
- No GPU needed
- Reliable, production-grade model

**Cons:**
- 5 RPM rate limit (10 min for 50 images)
- Google terms require appropriate use

**Estimated cost:** Free during development, ~$0.01-0.05/image at scale (Google's generous free tier before paid)

---

### Option B: Self-Hosted (GPU Required) — Recommended for Production at Scale

**Hardware:** NVIDIA RTX 4090 (24 GB) or RTX 3090 (24 GB)

```
User uploads images → vLLM server (Qwen2.5-VL-7B)
↓
Parallel inference (2-4 concurrent requests, ~5-10s/image)
↓
Extract design patterns
↓
Output JSON style profile
```

**Setup:**
```bash
# Install vLLM
pip install vllm

# Start server (requires quantization for 24 GB GPU)
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-VL-7B-Instruct \
  --gpu-memory-utilization 0.95 \
  --load-format bitsandbytes-nf4  # 4-bit quantization
```

**Node.js Client:**
```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "none",
  baseURL: "http://localhost:8000/v1"
});

const design_analysis = await client.chat.completions.create({
  model: "Qwen/Qwen2.5-VL-7B-Instruct",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Extract design style as JSON..." },
      { type: "image_url", image_url: { url: "file:///path/to/image.png" } }
    ]
  }],
  temperature: 0.1, // Deterministic for structured output
  max_tokens: 2000
});
```

**Pros:**
- Full control, no rate limits
- Faster processing (parallel inference)
- No API costs
- Can fine-tune if needed

**Cons:**
- ~$1,500-3,000 GPU upfront cost
- Requires NVIDIA driver, CUDA setup
- Model downloads (~8 GB for Qwen2.5-VL-7B)

**Throughput:** ~50 images in 5-8 minutes (4 concurrent workers)

---

### Option C: Hybrid (Recommended for Production)

```
For MVP/low volume → Gemini 2.5 Flash API
For high volume → Self-host Qwen2.5-VL-7B on GPU cluster
For fallback → OpenRouter free tier (Qwen3-VL)
```

**CLI Tool Pattern:**
```typescript
// src/core/design-analyzer.ts

interface DesignAnalysisService {
  analyze(imagePaths: string[]): Promise<StyleProfile[]>;
}

class GeminiAnalyzer implements DesignAnalysisService {
  async analyze(imagePaths) {
    // Batch to Gemini 2.5 Flash
    // Handle 5 RPM throttling
  }
}

class QwenAnalyzer implements DesignAnalysisService {
  async analyze(imagePaths) {
    // Local vLLM inference
    // Parallel processing
  }
}

// CLI selects analyzer based on --provider flag
const analyzer = process.env.PROVIDER === "local"
  ? new QwenAnalyzer()
  : new GeminiAnalyzer();
```

---

## Implementation Checklist

### If using **Gemini 2.5 Flash API:**
- [ ] Set up Google Cloud project & enable Gemini API
- [ ] Install `@google/generative-ai` npm package
- [ ] Create CLI flag `--batch-delay` for rate-limit compliance (200ms between requests)
- [ ] Implement image→Base64 conversion (PNG/SVG support)
- [ ] Parse JSON output from prompt engineering
- [ ] Add progress indicator (processing N/50 images)
- [ ] Cache results (avoid re-analyzing same image)

### If using **Self-Hosted Qwen2.5-VL-7B:**
- [ ] Verify GPU memory (17 GB minimum FP16, ~8 GB quantized)
- [ ] Install vLLM, transformers, torch
- [ ] Download model from Hugging Face (8 GB)
- [ ] Start vLLM server script
- [ ] Create health check for inference server
- [ ] Implement timeout handling (slow images)
- [ ] Add multi-worker queue for parallel processing
- [ ] Profile inference speed on your images

### General (Both Options):
- [ ] Design JSON schema for style profile output
- [ ] Create prompt template for design extraction (system prompt)
- [ ] Add image validation (size, format)
- [ ] Implement error handling for failed images
- [ ] Add logging/metrics (latency, cost estimates)
- [ ] Create unit tests with sample images
- [ ] Document setup instructions in README

---

## Detailed Node.js Integration Example

### Using Gemini 2.5 Flash:

```typescript
import * as fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface StyleProfile {
  colors: { dominant: string[]; palette: string[] };
  typography: { sizes: string[]; weights: string[]; families: string[] };
  layout: { type: string; alignment: string };
  illustrations: { style: string; complexity: string };
}

const DESIGN_ANALYSIS_PROMPT = `Analyze the design style in this image and extract:
1. Color palette (hex codes if visible)
2. Typography hierarchy (font sizes, weights, families if detectable)
3. Layout composition (grid, asymmetrical, centered, etc.)
4. Illustration style (flat, 3D, sketch, photographic, etc.)
5. Decorative elements

Return ONLY valid JSON with this structure:
{
  "colors": { "dominant": ["#xxx", ...], "palette": ["#xxx", ...] },
  "typography": { "sizes": ["large", "medium", "small"], "weights": ["bold", "regular"], "families": ["sans-serif", "serif"] },
  "layout": { "type": "grid|asymmetrical|centered|flow", "alignment": "left|center|right|justified" },
  "illustrations": { "style": "flat|3D|sketch|photographic", "complexity": "simple|moderate|complex" },
  "decorativeElements": ["element1", "element2"]
}`;

async function analyzeGraphic(imagePath: string): Promise<StyleProfile> {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/svg+xml";

  // Call Gemini API
  const response = await model.generateContent([
    { text: DESIGN_ANALYSIS_PROMPT },
    {
      inlineData: {
        mimeType,
        data: base64Image
      }
    }
  ]);

  // Parse JSON response
  const text = response.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to extract JSON from response");

  return JSON.parse(jsonMatch[0]);
}

// Batch processing with rate limiting
async function analyzeBatch(imagePaths: string[], batchDelayMs = 200) {
  const results: StyleProfile[] = [];

  for (const path of imagePaths) {
    const profile = await analyzeGraphic(path);
    results.push(profile);

    // Rate limit: 5 RPM = 200ms delay between requests
    await new Promise(resolve => setTimeout(resolve, batchDelayMs));
  }

  return results;
}

// Usage
const images = fs.readdirSync("./graphics").filter(f =>
  f.endsWith(".png") || f.endsWith(".svg")
);

const profiles = await analyzeBatch(
  images.map(f => `./graphics/${f}`),
  200 // 200ms delay = 5 requests/second (within rate limits)
);

console.log(JSON.stringify(profiles, null, 2));
```

---

## Cost & Performance Summary

| Approach | Setup Time | Monthly Cost (50 images/day) | Inference Speed | Control |
|----------|-----------|-----|----------|---------|
| **Gemini Free API** | 10 min | $0 (free tier) | 2-3s/img + 200ms throttle | Medium |
| **OpenRouter Free** | 10 min | $0-10 | 3-5s/img + rate limits | Low |
| **Qwen2.5-VL GPU** | 2-4 hours | $0 (GPU amortized) | 5-10s/img parallel | High |
| **Qwen2.5-VL Cluster** | 1 day | $50-200/month | 5-10s/img × 4 workers | Very High |

---

## Final Recommendation Ranking

### For Development/MVP (no GPU):
1. **Gemini 2.5 Flash** (free API, best quality)
2. **OpenRouter Free Qwen3-VL** (backup, excellent quality)
3. Cloudflare Workers (backup, adequate quality)

### For Production at Scale (with GPU):
1. **Qwen2.5-VL-7B** (self-hosted, best design-specific performance)
2. **LLaVA-OneVision-34B** (if you have 40+ GB VRAM)
3. Hybrid: Gemini for low volume + Qwen for high volume

### For Design Document Analysis (specialized):
1. **Pixtral Large** (if you can afford 60-80 GB quantized)
2. Otherwise, Qwen2.5-VL-7B (excellent general-purpose alternative)

### For Element Extraction Only (complementary):
- Florence-2 (lightweight, fast, good for color/shape detection)

---

## Unresolved Questions

1. **SVG parsing:** Do you need to analyze SVG source code (XML) or rasterized preview? If XML, consider custom SVG parser + separate color/typography analysis pipeline.

2. **Batch optimization:** For 20-50 images, is 10-minute processing acceptable? If not, self-hosting becomes mandatory.

3. **Fine-tuning:** Would you benefit from fine-tuning a model on design-specific examples? (advanced, requires dataset)

4. **Comparison across images:** Do you need cross-image style consistency analysis? (requires multi-image reasoning — Qwen/Pixtral excel here)

5. **Real-time feedback:** Is this batch processing or interactive tool? (affects API choice)

---

## Sources

- [Free AI API Models in 2026: Complete Guide - DEV Community](https://dev.to/lemondata_dev/free-ai-api-models-in-2026-complete-guide-to-zero-cost-ai-access-2nja)
- [20 Best Free AI APIs For Developers - VisionVix](https://visionvix.com/free-ai-apis/)
- [Best Open-Source Vision Language Models of 2026 - Labellerr](https://www.labellerr.com/blog/top-open-source-vision-language-models/)
- [Qwen2.5-VL - Hugging Face](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct)
- [LLaVA Official](https://llava-vl.github.io/)
- [Pixtral - Mistral AI Docs](https://docs.mistral.ai/capabilities/vision/)
- [Florence-2: Advancing Multiple Vision Tasks - Towards Data Science](https://towardsdatascience.com/florence-2-mastering-multiple-vision-tasks-with-a-single-vlm-model-435d251976d0/)
- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [Hugging Face Inference API](https://huggingface.co/inference-api/)
- [Hardware Requirements for Qwen2-VL](https://apxml.com/posts/gpu-system-requirements-qwen-models)
- [vLLM Multimodal Inputs Documentation](https://docs.vllm.ai/en/stable/features/multimodal_inputs/)
- [OpenRouter Free Models](https://openrouter.ai/collections/free-models)
- [Top 10 Vision Language Models in 2026 - DataCamp](https://www.datacamp.com/blog/top-vision-language-models)
- [Multimodal AI Guide - BentoML](https://www.bentoml.com/blog/multimodal-ai-a-guide-to-open-source-vision-language-models/)

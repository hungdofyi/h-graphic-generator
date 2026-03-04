# Tech Stack

## Core Runtime
- **Language:** TypeScript (Node.js 20+)
- **Build:** tsup (fast bundler, ESM + CJS dual output)
- **Package Manager:** npm

## Graphic Generation
| Layer | Tool | Purpose |
|-------|------|---------|
| SVG generation | Satori | HTML/CSS → SVG (~100ms, no browser) |
| Raster export | @resvg/resvg-js | SVG → PNG/JPG (~50ms) |
| Image processing | Sharp | Resize, format conversion, optimization |
| Diagram DSL | Mermaid (optional) | Flowcharts, sequence diagrams from text |

## Brand System
- **Design tokens:** JSON config (W3C-aligned format)
- **Token resolution:** Custom resolver (colors, typography, spacing, assets)

## Interfaces
| Interface | Library | Purpose |
|-----------|---------|---------|
| CLI | Commander.js | Batch/CI/scripted generation |
| MCP Server | @modelcontextprotocol/sdk | AI-assisted interactive generation |
| Core Library | Native exports | Programmatic use via npm |

## Export Pipeline
```
Template (HTML/CSS) → Satori (SVG) → resvg (PNG) → Sharp (resize/format)
```

Supported outputs: SVG, PNG, JPG, WebP, PDF (future)

## Testing
- **Unit:** Vitest
- **E2E:** Output snapshot comparison

## Key Decisions
1. **Satori over Puppeteer** — 10x faster, no browser dependency, serverless-friendly
2. **Hybrid architecture** — Core engine shared between CLI and MCP server
3. **JSON brand tokens** — Simple, machine-readable, LLM-friendly
4. **TypeScript** — Type safety for template props, SDK compatibility

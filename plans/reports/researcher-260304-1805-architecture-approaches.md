# Architecture Approaches for Branded Graphic Generation Tool

## Executive Summary
**Recommendation: Hybrid approach** (core library + CLI + MCP server). This maximizes flexibility for AI-assisted generation while maintaining independent scriptability.

---

## 1. MCP Server Approach

### How It Works
- **Stdio Transport**: Server runs as subprocess, communicates via JSON-RPC over stdin/stdout
- **Tool Definitions**: Server exposes tools via `tools/list` → LLM gets schema, calls `tools/call`
- **Resources**: Serve brand config as MCP resources (`file://brand-tokens.json`) for LLM context
- **Stateless**: Each request is independent; good for scalability

### TypeScript SDK (@modelcontextprotocol/sdk)
```
- Server class initialization
- Tool registration: server.tool("generate-diagram", schema, handler)
- Resource provisioning: server.resource("uri-scheme", handler)
- Automatic schema validation
```

### Strengths
✓ LLM has direct tool access (natural integration with Claude, etc.)
✓ Brand context as persistent resources (LLM "sees" brand tokens)
✓ Hot-swappable with different LLMs
✓ Real-time interactive refinement

### Weaknesses
✗ Requires running subprocess (resource overhead)
✗ No offline batch processing
✗ Debugging complexity (JSON-RPC debugging)
✗ Not suitable for CI/CD pipelines

---

## 2. CLI Approach

### Structure (Commander.js Pattern)
```
cli/
├── commands/
│   ├── generate.ts      # generate --template=logo --brand=acme
│   ├── validate.ts      # validate --config=brand.json
│   └── batch.ts         # batch --input=list.csv
├── index.ts
└── types.ts
```

### Strengths
✓ Scriptable & batch-friendly (perfect for CI/CD)
✓ No subprocess overhead
✓ Familiar to developers
✓ Easy versioning/distribution

### Weaknesses
✗ No AI assistance (static templating)
✗ Requires predefined args/flags
✗ Limited interactivity

---

## 3. Hybrid Architecture (RECOMMENDED)

### Codebase Structure
```
src/
├── core/                 # Shared graphic engine
│   ├── engine.ts         # Rendering logic
│   ├── brand-context.ts  # Brand token resolution
│   └── validators.ts
├── cli/
│   ├── commands/
│   └── index.ts          # Entry: bin/h-graphic-generator
└── mcp/
    ├── server.ts         # MCP server setup
    └── tools/            # Tool handlers

package.json:
{
  "bin": { "h-graphic": "./dist/cli/index.js" },
  "exports": {
    ".": "./dist/core/index.js",      # NPM package
    "./mcp": "./dist/mcp/server.js"   # MCP server
  }
}
```

### Workflow
1. **AI-Assisted**: LLM uses MCP server + brand resources → refines graphic iteratively
2. **Batch/CI**: CLI processes templates → no AI overhead
3. **Programmatic**: NPM package import → use core directly

### Benefits
✓ Single codebase (DRY principle)
✓ Flexible deployment (pick interface needed)
✓ Both async (MCP) and sync (CLI) patterns
✓ Testable core logic independently

---

## 4. Brand Context Strategy

### Brand Config Structure (JSON)
```json
{
  "colors": {
    "primary": "#0066CC",
    "secondary": "#FF6B35"
  },
  "typography": {
    "display": "Inter",
    "body": "Roboto"
  },
  "spacing": {
    "base": "8px",
    "scales": [8, 16, 24, 32, 48]
  },
  "logos": {
    "main": "assets/logo.svg",
    "icon": "assets/icon.svg"
  }
}
```

### MCP Resource Endpoints
```
resources:
  - type: file
    uri: brand://colors    → Serves color palette
  - type: file
    uri: brand://typography → Serves font family rules
  - type: file
    uri: brand://config    → Full brand config
```

**LLM Benefit**: Can reference `brand://colors` in prompts. MCP auto-serves file content as context.

---

## 5. Reference Patterns

### Monorepo Consideration
- **Single package**: Keep all in `src/` (< 1000 lines core)
- **Monorepo**: Consider if multiple backends (SVG, PDF, Canvas) exist

### Plugin Architecture (Future-Proof)
```
src/templates/
├── index.ts
├── builtin/
│   ├── logo.ts
│   └── poster.ts
└── custom/
    └── user-defined/
```
Templates register via factory pattern → extensible without core changes.

### Testing Strategy
- **Core tests**: Unit tests for brand resolution, rendering
- **CLI tests**: Command execution snapshots
- **MCP tests**: Tool schema validation, resource serving
- **E2E**: Generate real graphics, validate output

---

## Recommendation Summary

| Approach | AI-Assisted | Batch/CI | Testability |
|----------|-------------|----------|------------|
| **CLI Only** | ✗ | ✓✓ | ✓ |
| **MCP Only** | ✓✓ | ✗ | ✓ |
| **Hybrid** | ✓✓ | ✓✓ | ✓✓ |

**Decision**: Build **hybrid**. Ship CLI v1, add MCP server v2 (shared code path = minimal duplication).

---

## Unresolved Questions
- How large will brand configs grow? (impacts resource caching strategy)
- Target graphic output formats? (SVG-only vs PDF/PNG)
- Will templates be user-definable? (impacts plugin architecture urgency)

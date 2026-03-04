# Phase 1: Project Setup

## Overview
- **Priority:** P1 (blocking all other phases)
- **Status:** pending
- **Effort:** 3h
- Initialize TypeScript project, configure build tooling, install dependencies, scaffold directory structure, create default brand config.

## Key Insights
- tsup handles ESM+CJS dual output with minimal config
- Node 20+ required for native fetch and modern ESM support
- Satori requires font files loaded at runtime — must include default font or document font setup

## Requirements
- package.json with correct bin, exports, scripts
- TypeScript strict mode
- tsup config with 3 entry points (cli, mcp, core)
- ESLint + Prettier (minimal config)
- Directory structure matching design-guidelines.md
- Default brand.json with example brand tokens
- .gitignore for dist/, node_modules/, output files

## Related Code Files

### Files to Create
```
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/package.json
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tsconfig.json
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/tsup.config.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/.gitignore
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/.eslintrc.json
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/.prettierrc
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/README.md
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/index.ts          # barrel export
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/cli/index.ts           # CLI entry (placeholder)
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/mcp/server.ts          # MCP entry (placeholder)
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/templates/registry.ts  # placeholder
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/brand.json           # default brand config
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/assets/.gitkeep
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/brand/assets/fonts/Inter-Regular.ttf  # bundled default font
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/core/sanitize.ts                  # HTML escape + path validation utilities
```

## Implementation Steps

### 1. Initialize package.json
```json
{
  "name": "h-graphic-generator",
  "version": "0.1.0",
  "type": "module",
  "bin": { "hgraphic": "./dist/cli/index.js" },
  "exports": {
    ".": "./dist/core/index.js",
    "./mcp": "./dist/mcp/server.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src/",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "engines": { "node": ">=20.0.0" }
}
```

### 2. Install dependencies
> **[RED TEAM]** All deps consolidated here. No surprise installs in later phases.
```bash
npm install commander @modelcontextprotocol/sdk satori satori-html @resvg/resvg-js sharp zod picocolors puppeteer @mermaid-js/mermaid-cli
npm install -D typescript tsup vitest @vitest/coverage-v8 @types/node eslint prettier tsx
```

### 3. Configure tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 4. Configure tsup.config.ts
> **[RED TEAM]** Separate configs to avoid shebang pollution on library/MCP entries.
```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI entry — with shebang
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    target: 'node20',
    banner: { js: '#!/usr/bin/env node' },
  },
  // Core library + MCP server — NO shebang
  {
    entry: {
      'core/index': 'src/core/index.ts',
      'mcp/server': 'src/mcp/server.ts',
    },
    format: ['esm'],
    dts: true,
    target: 'node20',
    splitting: true,
  },
]);
```

### 5. Create default brand/brand.json
Use exact schema from design-guidelines.md (see Brand Token Format section).

### 6. Scaffold directory structure
Create all directories: src/core/, src/cli/commands/, src/mcp/tools/, src/templates/, brand/assets/, tests/

### 7. Create placeholder entry files
Each entry file should export minimal code to verify build works:
- `src/core/index.ts` — export empty object
- `src/cli/index.ts` — `console.log('hgraphic CLI')`
- `src/mcp/server.ts` — `console.log('MCP server')`

### 8. Create .gitignore
```
node_modules/
dist/
output/
*.png
*.jpg
*.webp
.env
```

### 9. Verify build
Run `npm run build` and confirm 3 entry points compile without errors.

## Todo List
- [ ] Create package.json with bin/exports/scripts
- [ ] Install all dependencies
- [ ] Configure tsconfig.json (strict, ESNext)
- [ ] Configure tsup.config.ts (3 entry points)
- [ ] Create .gitignore, .eslintrc.json, .prettierrc
- [ ] Scaffold all directories
- [ ] Create placeholder entry files
- [ ] Create default brand/brand.json
- [ ] Verify `npm run build` succeeds
- [ ] Create README.md with basic project description

## Success Criteria
- `npm run build` produces dist/ with cli/index.js, mcp/server.js, core/index.js
- `node dist/cli/index.js` runs without error
- TypeScript compiles with zero errors in strict mode
- All dependencies resolve correctly

## Risk Assessment
- **tsup shebang**: banner applies to all entries; may need per-entry config or post-build fix
  - Mitigation: Use tsup `esbuildOptions` or separate config for CLI entry
- **Satori font loading**: Requires .ttf/.woff2 fonts at runtime
  - Mitigation: Bundle a default font (Inter) or document font setup requirement

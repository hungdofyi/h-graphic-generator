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

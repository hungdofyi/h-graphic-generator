# Phase 4: CLI Interface

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- Implement Commander.js CLI with generate, diagram, brand, templates commands.

## Context Links
- [Design Guidelines](../../docs/design-guidelines.md) — CLI Commands, UX Principles
- [Phase 2](phase-02-core-engine.md) — Core Engine API
- [Phase 3](phase-03-template-system.md) — Template Registry

## Requirements

### Functional
- `hgraphic generate` — render template to file
- `hgraphic diagram` — generate diagram from node/edge data
- `hgraphic brand validate` — validate brand config
- `hgraphic templates list` — list available templates
- Sensible defaults: PNG format, brand/brand.json config, auto-size from template
- `--json` flag for machine-readable output
- `--dry-run` flag to preview without writing

### Non-functional
- Colorized output (use chalk or picocolors)
- Progress indication for rendering
- Helpful error messages with suggestions

## Related Code Files

### Files to Create
```
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/cli/index.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/cli/commands/generate.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/cli/commands/diagram.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/cli/commands/brand.ts
/Users/hungdo/Desktop/hung_repo/h-graphic-generator/src/cli/commands/templates.ts
```

### Dependencies to Add
> **[RED TEAM]** All deps moved to Phase 1. No separate install needed here.

## Implementation Steps

### 1. CLI entry point (src/cli/index.ts)

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { registerGenerateCommand } from './commands/generate.js';
import { registerDiagramCommand } from './commands/diagram.js';
import { registerBrandCommand } from './commands/brand.js';
import { registerTemplatesCommand } from './commands/templates.js';

const program = new Command();

program
  .name('hgraphic')
  .description('Branded graphic and diagram generator')
  .version('0.1.0');

registerGenerateCommand(program);
registerDiagramCommand(program);
registerBrandCommand(program);
registerTemplatesCommand(program);

program.parse();
```

### 2. Generate command (src/cli/commands/generate.ts)

```typescript
export function registerGenerateCommand(program: Command): void {
  program
    .command('generate')
    .description('Generate branded graphic from template')
    .requiredOption('-t, --template <name>', 'Template name')
    .option('-o, --output <path>', 'Output file path', 'output/graphic.png')
    .option('-f, --format <format>', 'Output format (svg|png|jpg|webp)', 'png')
    .option('-s, --size <WxH>', 'Output size (e.g., 1200x630)')
    .option('-b, --brand <path>', 'Brand config path', 'brand/brand.json')
    .option('-p, --props <json>', 'Template props as JSON string')
    .option('--props-file <path>', 'Template props from JSON file')
    .option('--json', 'Machine-readable JSON output')
    .option('--dry-run', 'Preview without writing file')
    .action(async (options) => {
      // 1. Load brand config via BrandContext
      // 2. Lookup template from registry
      // 3. Parse props from --props or --props-file
      // 4. [RED TEAM] validateProps(template, props) — enforce required, apply defaults
      // 5. Parse size (default from template)
      // 6. [RED TEAM] validateDimensions(width, height) — cap at 4096
      // 7. [RED TEAM] validateOutputPath(options.output) — reject traversal
      // 8. Render via Engine
      // 9. Export via ExportPipeline
      // 10. [RED TEAM] mkdir(dirname(output), { recursive: true }) — auto-create output dir
      // 11. Write to output path (unless dry-run)
      // 12. Print result (colorized or JSON)
    });
}
```

**Props input**: Accept JSON string via `--props '{"title":"Hello"}'` or file via `--props-file data.json`.

**Size parsing**: Parse `WxH` string like `1200x630` into `{width, height}`. Fall back to template's defaultSize.

### 3. Diagram command (src/cli/commands/diagram.ts)

```typescript
export function registerDiagramCommand(program: Command): void {
  program
    .command('diagram')
    .description('Generate branded diagram')
    .requiredOption('-i, --input <file>', 'Input JSON file with nodes/edges')
    .option('-o, --output <path>', 'Output file path', 'output/diagram.png')
    .option('-f, --format <format>', 'Output format', 'png')
    .option('-b, --brand <path>', 'Brand config path', 'brand/brand.json')
    .option('--title <text>', 'Diagram title')
    .option('--json', 'JSON output')
    .action(async (options) => {
      // 1. Read input file (JSON with nodes[] and edges[])
      // 2. Load brand config
      // 3. Use diagram-flow template with parsed data
      // 4. Render + export
    });
}
```

Input file format:
```json
{
  "nodes": [
    { "id": "a", "label": "Start" },
    { "id": "b", "label": "Process" },
    { "id": "c", "label": "End" }
  ],
  "edges": [
    { "from": "a", "to": "b" },
    { "from": "b", "to": "c" }
  ]
}
```

### 4. Brand command (src/cli/commands/brand.ts)

```typescript
export function registerBrandCommand(program: Command): void {
  const brand = program
    .command('brand')
    .description('Brand configuration management');

  brand
    .command('validate')
    .description('Validate brand configuration file')
    .option('-c, --config <path>', 'Brand config path', 'brand/brand.json')
    .option('--json', 'JSON output')
    .action(async (options) => {
      // 1. Try BrandContext.load(options.config)
      // 2. Report validation result (pass/fail + details)
    });
}
```

### 5. Templates command (src/cli/commands/templates.ts)

```typescript
export function registerTemplatesCommand(program: Command): void {
  program
    .command('templates')
    .description('Template management')
    .command('list')
    .description('List available templates')
    .option('-c, --category <cat>', 'Filter by category')
    .option('--json', 'JSON output')
    .action((options) => {
      // 1. Get templates from registry (optionally filtered)
      // 2. Print table or JSON
    });
}
```

### 6. Error handling

Wrap all command actions in try/catch. Print user-friendly errors:
```
Error: Template "hero" not found.
Available templates: hero-banner, feature-card, diagram-flow, social-og
```

### 7. Ensure shebang + executable

tsup config must add `#!/usr/bin/env node` to cli/index.js only. Post-build: `chmod +x dist/cli/index.js`.

## Todo List
- [ ] Install picocolors
- [ ] Implement CLI entry point with Commander.js
- [ ] Implement generate command with all options
- [ ] Implement diagram command with JSON input
- [ ] Implement brand validate command
- [ ] Implement templates list command
- [ ] Add size parsing utility (WxH string -> object)
- [ ] Add JSON output mode for all commands
- [ ] Add dry-run mode for generate/diagram
- [ ] Add error handling with helpful messages
- [ ] Ensure shebang in built CLI entry
- [ ] Test: `hgraphic generate -t hero-banner -p '{"title":"Test"}' -o test.png`

## Success Criteria
- `hgraphic generate -t hero-banner -p '{"title":"Hello"}' -o out.png` produces PNG
- `hgraphic templates list` shows 4 templates
- `hgraphic brand validate` reports valid/invalid brand config
- `--json` flag produces parseable JSON for all commands
- `--dry-run` does not write files
- Helpful error messages for missing templates, invalid props

## Risk Assessment
- **Commander.js subcommand nesting**: `brand validate` needs proper subcommand setup
  - Mitigation: Use `.command()` chaining correctly
- **JSON props parsing**: Shell escaping of JSON strings can be tricky
  - Mitigation: Support `--props-file` as alternative; document quoting rules

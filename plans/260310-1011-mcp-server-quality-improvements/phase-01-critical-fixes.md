# Phase 1: Critical Fixes

**Status:** Not Started
**Effort:** 2 hours
**Priority:** P0

---

## Overview

Fix the immediate blockers preventing Claude from generating good output:
1. Add inline color reference to SERVER_INSTRUCTIONS
2. Add `get_icon` tool returning actual SVG content
3. Ensure component responses always include svgContent
4. Fix stale SVG path references in recipes

---

## Task 1.1: Add Inline Color Reference

**File:** `src/mcp/server.ts`
**Location:** SERVER_INSTRUCTIONS constant (~line 17)

**Add after "## Color Hierarchy" section:**

```typescript
## Quick Color Reference (use these hex values directly)

### Primary Colors
- Green accent: #259B6C (green.600)
- Navy background: #05264C (blue.900)
- Text primary: #13151A (gray.900)
- Text muted: #8F99A3 (gray.600)

### Green Scale (most used)
- green.50: #EAF8F2 (semantic box background)
- green.100: #CCEDE0
- green.600: #259B6C (borders, accents)

### Gray Scale (borders, connectors)
- gray.200: #EDF1F5 (light fill)
- gray.400: #CBD0D7 (default borders)
- gray.600: #8F99A3 (connectors, muted)

### Usage
- Semantic/data elements: green.50 bg + green.600 border
- Default nodes: white bg + gray.400 border
- Connectors/arrows: gray.600 stroke
- Dark marketing backgrounds: #05264C (navy)
```

**Why:** Claude currently must call get_style_profile and parse nested JSON. This provides immediate access.

---

## Task 1.2: Add get_icon Tool

**File:** `src/mcp/tools/get-icon.ts` (new file)

```typescript
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

const ICONS_DIR = 'brand/data/icons';
const SVG_DIR = 'brand/svg';

/**
 * Semantic aliases for common icon requests
 */
const ICON_ALIASES: Record<string, string> = {
  'database': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'data-warehouse': 'brand/svg/diagram-icons/icon-data-warehouse.svg',
  'user': 'brand/svg/diagram-icons/icon-user-head.svg',
  'dashboard': 'brand/svg/diagram-icons/icon-dashboard.svg',
  'cursor': 'brand/svg/decorative/cursor.svg',
  'arrow-right': 'brand/svg/arrows/diagram-arrow-horizontal.svg',
  'arrow-down': 'brand/svg/arrows/arrow-b.svg',
};

export function registerGetIconTool(server: McpServer): void {
  server.tool(
    'get_icon',
    'Get actual SVG content for an icon. Use semantic names (database, cursor, arrow-right) or full paths. Returns embeddable SVG markup.',
    {
      name: z.string().describe('Icon name (e.g., "database", "cursor") or path (e.g., "chart/bar-chart")'),
    },
    async (args) => {
      try {
        let svgPath: string;

        // Check aliases first
        if (ICON_ALIASES[args.name]) {
          svgPath = path.resolve(ICON_ALIASES[args.name]);
        } else {
          // Try brand/data/icons/ first, then brand/svg/
          const iconPath = path.resolve(ICONS_DIR, `${args.name}.svg`);
          const svgFullPath = path.resolve(SVG_DIR, `${args.name}.svg`);

          try {
            await fs.access(iconPath);
            svgPath = iconPath;
          } catch {
            svgPath = svgFullPath;
          }
        }

        const content = await fs.readFile(svgPath, 'utf-8');

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              name: args.name,
              path: svgPath,
              svgContent: content.trim(),
              usage: 'Embed this SVG directly in your HTML. Use CSS variables (--fill-0, --stroke-0) for customization.',
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Icon "${args.name}" not found`,
              availableAliases: Object.keys(ICON_ALIASES),
              hint: 'Use list_icons to discover available icons',
            }),
          }],
          isError: true,
        };
      }
    }
  );
}
```

**Register in:** `src/mcp/tools/index.ts`
```typescript
import { registerGetIconTool } from './get-icon.js';
// ... in registerTools():
registerGetIconTool(server);
```

---

## Task 1.3: Component SVG Content Always Included

**File:** `src/mcp/tools/get-pattern.ts`
**Issue:** `getComponentWithSvg()` only works if component has `svgTemplate` field

**Fix:** Also check for SVGs matching component name in `brand/svg/{category}/`

```typescript
// In get_pattern.ts, after line 91 where getComponentWithSvg is called:
// Add fallback SVG lookup

async function findComponentSvg(componentKey: string): Promise<string | null> {
  const [category, name] = componentKey.split('/');
  const possiblePaths = [
    `brand/svg/${category}/${name}.svg`,
    `brand/svg/diagram-icons/icon-${name}.svg`,
    `brand/svg/decorative/${name}.svg`,
  ];

  for (const p of possiblePaths) {
    try {
      const content = await fs.readFile(path.resolve(p), 'utf-8');
      return content.trim();
    } catch {
      continue;
    }
  }
  return null;
}
```

---

## Task 1.4: Fix Recipe SVG References

**Files:**
- `brand/recipes/diagrams/architecture-flow.md`
- `brand/recipes/diagrams/data-flow.md`

**Current (broken):**
```markdown
| Database | nodes/box | svg/diagram-icons/database.svg |
```

**Fixed:**
```markdown
| Database | nodes/box | svg/diagram-icons/icon-data-warehouse.svg |
```

**Also add note:**
```markdown
> **Tip:** Use `get_icon("database")` to fetch SVG content directly.
```

---

## Validation

1. Build: `npm run build`
2. Test get_icon:
   ```bash
   # Use MCP inspector or test script
   echo '{"name":"database"}' | npx mcp-client get_icon
   ```
3. Verify SVG content returned contains actual paths, not error
4. Test full flow: Generate data-flow diagram, verify cylinder renders

---

## Rollback

If issues occur:
1. Revert SERVER_INSTRUCTIONS changes
2. Remove get-icon.ts and its registration
3. Revert recipe markdown changes

No database or external dependencies affected.

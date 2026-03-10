# Phase 2: Remove YAGNI Violations

**Status:** Not Started
**Effort:** 2 hours
**Priority:** P1
**Depends on:** Phase 1 (verify fixes work before removing code)

---

## Overview

Remove ~700 LOC of dead/unused code:
- Template system (4 templates, 2 tools, registry)
- `create_graphic` tool (redundant with SERVER_INSTRUCTIONS)
- Dead constants in server.ts
- Legacy extraction files

---

## Task 2.1: Remove Template System

**Delete files:**
```
src/templates/registry.ts
src/templates/process-steps/index.ts
src/templates/concept-comparison/index.ts
src/templates/linear-flow/index.ts
src/templates/feature-illustration/index.ts
src/mcp/tools/generate-from-template.ts
src/mcp/tools/list-templates.ts
```

**Before deleting, verify no imports:**
```bash
grep -r "from.*templates" src/
grep -r "registerGenerateFromTemplateTool\|registerListTemplatesTool" src/
```

**Update:** `src/mcp/tools/index.ts`
```typescript
// REMOVE these lines:
import { registerGenerateFromTemplateTool } from './generate-from-template.js';
import { registerListTemplatesTool } from './list-templates.js';

// REMOVE from registerTools():
registerGenerateFromTemplateTool(server, brandContext);
registerListTemplatesTool(server);
```

**Estimated removal:** ~400 LOC

---

## Task 2.2: KEEP create_graphic Tool (Correction)

**Previous recommendation was WRONG.**

`create_graphic` is:
- The **recommended entry point** in SERVER_INSTRUCTIONS
- A guided workflow (start → type → requirements → render)
- Structured approach to enforce requirement gathering

**Do NOT remove.** Instead, consider improving in future:
- Add brand color reference to its responses
- Include recipe hints based on graphic type
- Return ready-to-use CSS snippets

**No changes in this phase.**

---

## Task 2.3: Remove Dead Constants

**File:** `src/mcp/server.ts`

**Remove:**
```typescript
// Line 105-113 - WORKFLOW_GUIDANCE (unused constant)
const WORKFLOW_GUIDANCE = `
WORKFLOW REQUIREMENT: Before calling render_graphic, you MUST:
...
`.trim();
```

**Keep:** `INTAKE_WORKFLOW_CONTENT` is used by `graphic_intake` prompt - remove in Phase 3 if prompt removed.

---

## Task 2.4: Remove Dead Constants Only

**NOTE:** Do NOT delete v1 extraction files - they contain newest content (Mar 9).
Schema unification is handled in Phase 3.

**Only remove in this phase:**
- `WORKFLOW_GUIDANCE` constant in server.ts (already done in 2.3)
- Template-related dead code

**Estimated removal:** ~50 lines (constants only)

---

## Validation

1. Build: `npm run build` (should compile with fewer files)
2. Test: `npm run test`
3. Verify tool list:
   ```bash
   # MCP should now have 7 tools (was 10):
   # render_graphic, get_style_profile, list_icons, get_icon,
   # list_patterns, get_pattern, validate_brand, serve_preview, stop_preview
   ```
4. Manual test: Generate graphic to verify nothing broke

---

## Rollback

Git restore deleted files:
```bash
git checkout HEAD -- src/templates/
git checkout HEAD -- src/mcp/tools/create-graphic.ts
git checkout HEAD -- src/mcp/tools/generate-from-template.ts
git checkout HEAD -- src/mcp/tools/list-templates.ts
git checkout HEAD -- brand/extracted/
```

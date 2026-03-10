# MCP Server Quality Improvements

**Created:** 2026-03-10
**Status:** Not Started
**Branch:** main
**Goal:** Fix systematic issues preventing high-quality branded graphic output

---

## Problem Statement

Claude generates poor output (gray colors, wrong shapes) because:
1. Too many overlapping guidance systems (4+)
2. Tools return paths, not embeddable content
3. No inline color reference - Claude must parse nested JSON
4. YAGNI violations add confusion (10 tools, only 6 needed)

## Success Criteria

- [ ] Claude uses brand colors without extra tool calls
- [ ] Icons/SVGs embed correctly on first attempt
- [ ] ~300 LOC removed (template system, dead constants)
- [ ] Tools: 10 → 9 (add get_icon, remove 2 template tools)
- [ ] Extraction schema unified (v1+v2 → single format)
- [ ] SVG folders merged (svg-templates → brand/svg)

---

## Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 1](phase-01-critical-fixes.md) | Inline colors + get_icon tool | Not Started | 2h |
| [Phase 2](phase-02-remove-yagni.md) | Remove template system + create_graphic | Not Started | 2h |
| [Phase 3](phase-03-consolidate.md) | Consolidate extractions, simplify components | Not Started | 3h |

---

## Key Files

**Modify:**
- `src/mcp/server.ts` - Add inline color reference
- `src/mcp/tools/index.ts` - Remove unused tool registrations
- `src/mcp/tools/list-icons.ts` - Add content option OR new get_icon
- `src/mcp/tools/get-pattern.ts` - Always include svgContent
- `brand/recipes/diagrams/*.md` - Fix SVG path references

**Delete:**
- `src/mcp/tools/generate-from-template.ts`
- `src/mcp/tools/list-templates.ts`
- `src/templates/` (entire directory)
- `brand/extracted/svg-templates/` (after merging 40 unique SVGs to brand/svg)

**Migrate:**
- 14 v1 extraction files → unified schema (don't delete, they have newest content)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing integrations | Run MCP inspector tests before/after |
| Removing needed functionality | Grep codebase for imports before delete |
| Extraction consolidation breaks loader | Keep v2 schema, only merge content |

---

## Dependencies

- None external
- Phase 2 depends on Phase 1 (verify fixes work before removing code)
- Phase 3 can run parallel to Phase 2

---

## Validation

After each phase:
1. `npm run build` - Verify compilation
2. `npm run test` - Run existing tests
3. Manual test: Generate data-flow diagram with reference image
4. Verify output uses brand colors and correct shapes

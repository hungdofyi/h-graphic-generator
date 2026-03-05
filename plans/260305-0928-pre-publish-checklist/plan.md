# Pre-Publish Checklist

> Prepare h-graphic-generator for internal team use. Maintainer handles all brand/style extraction before publishing — team consumes pre-baked tokens + style profile via CLI/MCP.

**Status:** Not Started
**Branch:** main
**Audience:** Internal team only

---

## Maintainer Workflow (You)

1. Replace placeholder `brand/brand.json` with real brand tokens (colors, typography, spacing)
2. Add real brand assets (logo.svg, icon.svg, fonts) to `brand/assets/`
3. Add reference images to `brand/references/{category}/`
4. Run `GEMINI_API_KEY=xxx hgraphic brand extract-style --references brand/references`
5. Review + tweak generated `brand/style-profile.json` and `brand/style-profile.md`
6. Commit everything, push — team is ready to use

---

## Phases

| Phase | Description | Status | Priority |
|-------|-------------|--------|----------|
| 1 | Real brand setup (tokens + assets) | Not Started | Critical |
| 2 | Style extraction with real references | Not Started | Critical |
| 3 | Package.json cleanup | Not Started | High |
| 4 | README & docs accuracy | Not Started | High |
| 5 | CI/CD setup | Not Started | Medium |
| 6 | E2E test coverage | Not Started | Low |
| 7 | Final validation & tag | Not Started | Critical (last) |

---

## Phase 1: Real Brand Setup

**Effort:** 30 min (depends on asset availability)

- [ ] Replace `brand/brand.json` with real brand colors, typography, spacing
- [ ] Add real logo SVG to `brand/assets/logo.svg`
- [ ] Add real icon SVG to `brand/assets/icon.svg` (or remove from config if not needed)
- [ ] Remove `watermark` from assets if not applicable
- [ ] Add brand fonts to `brand/assets/fonts/` (WOFF format, static weight)
- [ ] Update typography config to reference actual brand fonts
- [ ] Run `hgraphic brand validate` — confirm it passes

**Files:** `brand/brand.json`, `brand/assets/`

---

## Phase 2: Style Extraction with Real References

**Effort:** 30 min

- [ ] Collect 5-10 reference images of existing brand graphics
- [ ] Organize into `brand/references/{category}/` subfolders (e.g., `marketing/`, `social/`, `docs/`)
- [ ] Run `GEMINI_API_KEY=xxx hgraphic brand extract-style --references brand/references`
- [ ] Review generated `brand/style-profile.json` — verify accuracy
- [ ] Edit `brand/style-profile.md` if any descriptions need tweaking
- [ ] Commit `style-profile.json` and `style-profile.md` to repo
- [ ] Decide: commit reference images or `.gitignore` them (only profile matters for team)

**Files:** `brand/references/`, `brand/style-profile.json`, `brand/style-profile.md`

---

## Phase 3: Package.json Cleanup

**Effort:** 10 min

- [ ] Add `files` field: `["dist/", "brand/", "README.md", "LICENSE"]`
- [ ] Add `author` field
- [ ] Add `repository` field
- [ ] Create `LICENSE` file (MIT) if not present
- [ ] Run `npm pack --dry-run` to verify package contents
- [ ] Verify `bin.hgraphic` resolves correctly

**Files:** `package.json`, `LICENSE`

---

## Phase 4: README & Docs Accuracy

**Effort:** 15 min

- [ ] Change "Production Ready: Yes" to something like "Internal Release"
- [ ] Remove/simplify style extraction docs (team doesn't need to run it)
- [ ] Clarify that brand tokens + style profile are pre-configured
- [ ] Verify all CLI examples work: `render`, `generate`, `diagram`, `templates list`
- [ ] Review `docs/walkthrough.md` for team onboarding accuracy
- [ ] Update `docs/maintainer-guide.md` with actual maintainer workflow

**Files:** `README.md`, `docs/walkthrough.md`, `docs/maintainer-guide.md`

---

## Phase 5: CI/CD Setup

**Effort:** 30 min

- [ ] Create `.github/workflows/ci.yml` (build, typecheck, lint, test)
- [ ] Node 20 + npm cache
- [ ] Trigger on push/PR to main
- [ ] Verify CI passes

**Files:** `.github/workflows/ci.yml`

---

## Phase 6: E2E Test Coverage (Optional)

**Effort:** 1-2h

- [ ] E2E: render HTML string to PNG, verify valid image output
- [ ] E2E: generate from template, verify output file
- [ ] E2E: diagram from JSON nodes
- [ ] E2E: brand validate command
- [ ] Confirm all existing tests pass: `npm run test:run`

**Files:** `tests/`

---

## Phase 7: Final Validation & Tag

**Effort:** 15 min

- [ ] `npm run build && npm run typecheck && npm run lint && npm run test:run`
- [ ] Manual test: `npx hgraphic render --html "<div>test</div>" -o test.png`
- [ ] Manual test: MCP server in Claude Desktop
- [ ] `npm pack --dry-run`
- [ ] `git tag v0.1.0 && git push origin v0.1.0`

# Maintainer Guide

> Next steps and ongoing maintenance tasks for h-graphic-generator.

## Immediate Next Steps

### 1. Pre-Release Checklist

- [ ] **Push to remote**: `git push origin main`
- [ ] **Create GitHub release**: Tag as `v0.1.0`
- [ ] **Publish to npm** (optional): `npm publish`
- [ ] **Set up CI/CD**: GitHub Actions for test/lint on PR

### 2. Team Onboarding

- [ ] Share `docs/walkthrough.md` with teammates
- [ ] Add MCP server to team's Claude Desktop configs
- [ ] Create shared `brand/brand.json` with actual brand tokens
- [ ] Add reference images to `brand/references/` for style extraction

### 3. Brand Customization

- [ ] Replace default brand colors in `brand/brand.json`
- [ ] Add custom fonts to `brand/assets/fonts/` (WOFF format)
- [ ] Run `hgraphic brand extract-style` with reference images
- [ ] Review generated `brand/style-profile.json`

---

## Recommended Enhancements (Priority Order)

### High Priority

| Task | Effort | Impact |
|------|--------|--------|
| Add more templates (testimonial, pricing, stats) | 2-3h each | High - more use cases |
| Image embedding in HTML (base64 or URL) | 2h | High - richer graphics |
| GitHub Actions CI (test + lint) | 1h | High - quality gates |
| Puppeteer renderer for complex CSS | 2h | Medium - gradients/shadows |

### Medium Priority

| Task | Effort | Impact |
|------|--------|--------|
| Template preview command (`hgraphic templates preview -t X`) | 2h | Medium - better DX |
| Watch mode for HTML file changes | 1h | Medium - faster iteration |
| Batch generation from CSV/JSON | 2h | Medium - bulk workflows |
| Custom font loading from URL | 2h | Low - edge case |

### Low Priority

| Task | Effort | Impact |
|------|--------|--------|
| Web UI for non-technical users | 8h+ | Low - different audience |
| Animation support (GIF/video) | 4h+ | Low - scope creep |
| Remote brand config loading | 2h | Low - enterprise feature |

---

## Maintenance Tasks

### Weekly

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Check for dependency updates: `npm outdated`
- [ ] Review any user-reported issues

### Monthly

- [ ] Update Gemini model version if needed
- [ ] Review and prune unused templates
- [ ] Update documentation if APIs changed

### On Dependency Updates

```bash
# Safe update (minor/patch)
npm update

# Check for breaking changes
npm outdated

# Full audit
npm audit
npm audit fix
```

---

## CI/CD Setup (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run typecheck
      - run: npm test
```

---

## Adding New Templates

1. Create folder: `src/templates/my-template/index.ts`
2. Implement `Template` interface:

```typescript
import type { Template, BrandConfig } from '../../core/types.js';
import { escapeHtml } from '../../core/sanitize.js';

export const myTemplate: Template = {
  name: 'my-template',
  description: 'Description for template discovery',
  category: 'marketing', // marketing | diagram | social | docs
  defaultSize: { width: 800, height: 600 },
  props: {
    title: { type: 'string', required: true, description: 'Main title' },
    subtitle: { type: 'string', required: false, default: '', description: 'Optional subtitle' },
  },
  render: (props: Record<string, unknown>, brand: BrandConfig): string => {
    const title = escapeHtml(String(props['title'] || ''));
    // Return HTML string using brand tokens
    return `<div style="background:${brand.colors['primary']?.value}">...</div>`;
  },
};
```

3. Register in `src/templates/registry.ts`:

```typescript
import { myTemplate } from './my-template/index.js';
// ...
registry.register(myTemplate);
```

4. Rebuild: `npm run build`

---

## Security Considerations

### Already Implemented

- ✅ HTML sanitization (XSS prevention)
- ✅ SVG sanitization (XXE prevention)
- ✅ Path traversal protection
- ✅ Dimension limits (DoS prevention)
- ✅ API key from env only

### Monitor

- Keep Puppeteer updated (sandbox escapes)
- Review sharp/resvg for CVEs
- Don't expose MCP server to network (stdio only)

---

## Troubleshooting Production Issues

### Memory Issues

```bash
# Increase Node memory for large images
NODE_OPTIONS="--max-old-space-size=4096" hgraphic render ...
```

### Font Issues

- Satori only supports WOFF/TTF (not WOFF2 or variable fonts)
- Fonts must be static weight, not variable
- Check `brand/assets/fonts/` has correct format

### Gemini Rate Limits

- Free tier: 10 RPM (handled with 6.5s delay)
- For higher throughput, upgrade to paid tier
- Rate limiter is per-instance, not global

---

## Metrics to Track

| Metric | How to Measure |
|--------|----------------|
| Render time | `--json` output includes timing |
| Success rate | Parse `--json` output in scripts |
| Template usage | Log which templates are called |
| Error types | Monitor stderr in production |

---

## Contact & Support

- **Issues**: GitHub Issues
- **Docs**: `docs/` directory
- **Architecture**: `docs/architecture.md`
- **Code Standards**: `docs/code-standards.md`

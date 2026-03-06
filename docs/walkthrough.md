# h-graphic-generator Walkthrough

> Quick guide for teammates to generate branded graphics using CLI or AI agents.

## Table of Contents
- [Setup (One-Time)](#setup-one-time)
- [CLI Usage](#cli-usage)
- [Using with Claude Code](#using-with-claude-code)
- [Using with Claude Desktop (MCP)](#using-with-claude-desktop-mcp)
- [Using with Other AI Agents](#using-with-other-ai-agents)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

---

## Setup (One-Time)

```bash
# 1. Clone and install
cd h-graphic-generator
npm install

# 2. Build
npm run build

# 3. (Optional) Link CLI globally
npm link

# 4. Verify installation
hgraphic --help
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Only for style extraction | Get free at https://aistudio.google.com/apikey |

---

## CLI Usage

### Quick Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `render` | HTML/CSS → Image (PRIMARY) | `hgraphic render --html "<div>Hello</div>" -o out.png` |
| `generate` | Template → Image | `hgraphic generate -t feature-illustration --props '{"title":"X"}'` |
| `diagram` | JSON nodes → Diagram | `hgraphic diagram -i nodes.json -o diagram.png` |
| `brand validate` | Check brand.json | `hgraphic brand validate` |
| `templates list` | Show all templates | `hgraphic templates list` |

### Render HTML (Primary Workflow)

```bash
# Simple inline HTML
hgraphic render --html '<div style="background:#3b82f6;color:white;padding:40px;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">Hello World</div>' -o hello.png

# From file
hgraphic render --file my-design.html -o output.png

# Custom size and format
hgraphic render --html "..." -o banner.webp --format webp --size 1920x1080

# JSON output (for scripts)
hgraphic render --html "..." -o out.png --json
```

### Generate from Template

```bash
# List available templates first
hgraphic templates list

# Feature illustration
hgraphic generate -t feature-illustration \
  --props '{"title":"Lightning Fast","description":"Build in seconds","icon":"⚡"}' \
  -o feature.png

# Process steps
hgraphic generate -t process-steps \
  --props '{"steps":[{"number":"1","title":"Install"},{"number":"2","title":"Build"},{"number":"3","title":"Deploy"}]}' \
  -o steps.png

# Concept comparison
hgraphic generate -t concept-comparison \
  --props '{"leftTitle":"Before","leftItems":["Slow","Complex"],"rightTitle":"After","rightItems":["Fast","Simple"]}' \
  -o compare.png
```

### Diagram from JSON

Create `nodes.json`:
```json
{
  "title": "User Flow",
  "nodes": [
    { "id": "1", "label": "Login", "icon": "🔐" },
    { "id": "2", "label": "Dashboard", "icon": "📊" },
    { "id": "3", "label": "Export", "icon": "📤" }
  ],
  "edges": [
    { "from": "1", "to": "2" },
    { "from": "2", "to": "3" }
  ],
  "direction": "horizontal"
}
```

```bash
hgraphic diagram -i nodes.json -o flow.png
```

---

## Using with Claude Code

Claude Code can use this tool directly via CLI. Just describe what you want:

### Example Prompts

**Generate a feature graphic:**
```
Create a branded feature illustration for "Auto-save" with description
"Never lose your work again" using the h-graphic-generator CLI.
Save to output/autosave-feature.png
```

**Render custom HTML:**
```
Use hgraphic to render this HTML to a 1200x630 PNG:
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     color: white; padding: 60px; height: 100%; display: flex;
     flex-direction: column; justify-content: center;">
  <h1 style="font-size: 48px; margin: 0;">Welcome to Our Product</h1>
  <p style="font-size: 24px; opacity: 0.9;">The future of productivity</p>
</div>
```

**Generate a process diagram:**
```
Create a 3-step process diagram showing: Research → Design → Build
Use the diagram command with nodes.json format.
```

### Claude Code Tips

1. **Be specific about output path** - Always specify `-o output/filename.png`
2. **Use JSON for complex props** - Template props must be valid JSON
3. **Check templates first** - Ask to run `hgraphic templates list` to see options
4. **Validate brand** - Run `hgraphic brand validate` if styling looks wrong

---

## Using with Claude Desktop (MCP)

### Setup MCP Server

1. Build the project: `npm run build`
2. Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "h-graphic-generator": {
      "command": "node",
      "args": ["/FULL/PATH/TO/h-graphic-generator/dist/mcp/server.js"],
      "env": {
        "GEMINI_API_KEY": "your-key-here"
      }
    }
  }
}
```

3. Restart Claude Desktop

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `get_style_profile` | Get brand tokens (colors, typography, spacing) |
| `list_patterns` | Browse Figma-extracted design patterns |
| `get_pattern` | Get detailed styling for a pattern |
| `list_icons` | Browse 300+ brand icons |
| `render_graphic` | Render HTML/CSS → image |
| `list_templates` | Show available templates |
| `generate_from_template` | Template → image |
| `validate_brand` | Check brand config |

### Example MCP Prompts

```
Use the render_graphic tool to create a hero banner with:
- Blue gradient background
- White text "Welcome to Acme"
- 1920x600 size
- Save to output/hero.png
```

```
First use get_style_profile to understand the brand colors,
then use render_graphic to create a branded call-to-action button image.
```

---

## Using with Other AI Agents

### Generic Agent Instructions

Add this to your agent's system prompt:

```
You have access to a CLI tool called `hgraphic` for generating branded graphics.

COMMANDS:
- `hgraphic render --html "<HTML>" -o <output.png>` - Render HTML to image
- `hgraphic generate -t <template> --props '<JSON>' -o <output.png>` - From template
- `hgraphic diagram -i <nodes.json> -o <output.png>` - Create diagram
- `hgraphic templates list` - List available templates
- `hgraphic brand validate` - Validate brand configuration

TEMPLATES AVAILABLE:
- feature-illustration: {title, description?, icon?}
- process-steps: {steps: [{number, title, description?}]}
- concept-comparison: {leftTitle, leftItems[], rightTitle, rightItems[]}
- linear-flow: {nodes: [{id, label}], edges: [{from, to}]}

OUTPUT FORMATS: png (default), svg, jpg, webp
DEFAULT SIZE: 1200x630 (override with --size WxH)

Always use --json flag when you need to parse the output programmatically.
```

### API-Style Usage (for scripts)

```bash
# All commands support --json for machine-readable output
hgraphic render --html "..." -o out.png --json
# Returns: {"success":true,"output":"/path/to/out.png","format":"png","width":1200,"height":630,"size":12345}

hgraphic templates list --json
# Returns: {"count":4,"templates":[...]}
```

---

## Common Workflows

### 1. Quick Social Media Graphic

```bash
hgraphic render --html '
<div style="background:#1a1a2e;color:white;padding:60px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
  <div style="font-size:48px;font-weight:bold;margin-bottom:20px;">🚀 New Feature!</div>
  <div style="font-size:24px;opacity:0.8;">Check out our latest update</div>
</div>
' -o social-post.png --size 1080x1080
```

### 2. Blog Header Image

```bash
hgraphic generate -t feature-illustration \
  --props '{"title":"Getting Started Guide","description":"Everything you need to know","icon":"📚"}' \
  -o blog-header.png --size 1200x630
```

### 3. Documentation Diagram

```bash
# Create nodes.json with your architecture
echo '{
  "title": "System Architecture",
  "nodes": [
    {"id":"ui","label":"Frontend","icon":"🖥️"},
    {"id":"api","label":"API","icon":"⚙️"},
    {"id":"db","label":"Database","icon":"💾"}
  ],
  "edges": [{"from":"ui","to":"api"},{"from":"api","to":"db"}]
}' > arch.json

hgraphic diagram -i arch.json -o architecture.png
```

### 4. Batch Generation (Shell Script)

```bash
#!/bin/bash
for feature in "Fast" "Secure" "Reliable"; do
  hgraphic generate -t feature-illustration \
    --props "{\"title\":\"$feature\",\"icon\":\"✨\"}" \
    -o "output/${feature,,}-feature.png"
done
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `command not found: hgraphic` | Run `npm link` or use `npx tsx src/cli/index.ts` |
| `Failed to read brand config` | Ensure `brand/brand.json` exists and is valid JSON |
| `Font not found` | Default fonts bundled (Inter, Inter Display, JetBrains Mono); custom fonts go in `brand/assets/fonts/static/` |
| `GEMINI_API_KEY required` | Only needed for `brand extract-style` command |
| `Output path outside allowed directory` | Security feature - output must be within project directory |
| `Dimensions must be <= 4096px` | Max size is 4096x4096 to prevent DoS |

### Debug Mode

```bash
# Add DEBUG=* for verbose output
DEBUG=* hgraphic render --html "..." -o out.png
```

### Validate Everything Works

```bash
# Quick smoke test
npm run build
hgraphic brand validate
hgraphic templates list
hgraphic render --html '<div style="background:green;height:100%">Test</div>' -o test.png
ls -la test.png  # Should exist with size > 0
```

---

## Need Help?

- **Docs**: See `docs/architecture.md` for technical details
- **Examples**: Check `output/` directory for sample outputs
- **Brand config**: Edit `brand/brand.json` to customize colors/fonts
- **Templates**: Run `hgraphic templates list --json` for full schema

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BrandContext } from '../core/brand-context.js';
import { ExtractionLoader } from '../core/extraction-loader.js';
import { ComponentLoader } from '../core/component-loader.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/brand-resources.js';

// Get project root from module location (dist/mcp/server.js -> project root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Server instructions - injected into AI context automatically
const SERVER_INSTRUCTIONS = `
Generate branded graphics using MCP tools. IMPORTANT: Always gather requirements before rendering.

## CRITICAL RULES (Read First!)

### Typography
- **Sentence case ONLY** - NEVER use ALL CAPS or \`text-transform: uppercase\`
- Region codes (NA, EU, APAC) and acronyms are exceptions as proper nouns

### What NOT to Add
- **No browser chrome** - Don't add macOS window dots (red/yellow/green), title bars, or fake browser UI
- **No OS emojis** - Use brand icons or CSS shapes instead
- **No decorative elements** not specified in brand system
- **No mixed styles** - Don't combine docs and marketing patterns

### Layout Safety
- **Calculate heights BEFORE coding** - Sum all sections, ensure total ≤ canvas
- **Reserve 32-48px bottom padding** - Content must not touch canvas edge
- **No negative positioning** - Avoid \`top: -12px\` for badges (causes clipping)
- **Explicit heights only** - Never use \`flex: 1\` for critical sections

## Graphic Generation Workflow

### Step 1: Clarify Intent
Ask the user what type of graphic they need:
- **diagram** - Technical flows, architecture, data pipelines
- **annotation** - Screenshot highlights, feature documentation
- **marketing** - Feature showcases, promotional graphics

### Step 2: Gather Required Inputs (ask 3-5 questions)

**For Diagrams:**
- What nodes/elements need to be shown?
- How do they connect? (from → to)
- Flow direction? (left-to-right, top-to-bottom)
- Any grouping or sections?

**For Annotations:**
- Screenshot image provided?
- What element(s) to highlight?
- Text annotations needed?

**For Marketing:**
- Feature name/headline?
- Visual focus (icon, dashboard, code)?
- Background style (dark navy, green gradient)?

### Step 3: Generate
Only after gathering inputs:
1. Call \`get_style_profile\` for brand tokens AND creative guidance
2. Call \`get_pattern\` for recipe/component styles
3. **Fetch required assets** (MANDATORY):
   - For cursors/pointers: \`get_pattern("component:decorative/cursors")\` - returns SVG content
   - For icons: \`list_icons\` to discover, then embed from \`brand/data/icons/\`
   - For arrows/connectors: \`get_pattern("component:decorative/arrows")\` or \`get_pattern("component:connectors/...")\`
4. **Calculate layout dimensions** before writing CSS
5. Generate HTML/CSS using fetched SVG assets (NEVER invent CSS shapes for cursors/icons)
6. Call \`render_graphic\` to output the image

## Pre-render Checklist

Before calling \`render_graphic\`, verify:
- [ ] Sentence case only (no ALL CAPS)
- [ ] No browser chrome or fake window UI
- [ ] Height calculated and fits canvas
- [ ] Bottom padding ≥ 32px
- [ ] No negative positioning on badges
- [ ] Colors use brand tokens (green.X, blue.X, gray.X)
- [ ] **Cursors use brand SVG** from \`component:decorative/cursors\` (never CSS tricks)
- [ ] **Icons use brand library** from \`list_icons\` (never inline stroke SVGs < 16px)
- [ ] **SVG viewBox has padding** - elements not at 0 or max edges

## Available Tools
- \`create_graphic\` - **RECOMMENDED** Start with this! Uses interactive forms for step-by-step input
- \`get_style_profile\` - Official brand guidelines (colors, typography, spacing, creative guidance)
- \`list_patterns\` - Discover style libraries, components, recipes
- \`get_pattern\` - Get detailed styling for a category
- \`list_icons\` - Browse 300+ brand icons
- \`render_graphic\` - Render HTML/CSS to PNG/SVG (use after gathering requirements)
- \`serve_preview\` / \`stop_preview\` - Preview server for Figma export

## Color Hierarchy
- **Primary:** Green scale (green.50-900) - main brand accent
- **Secondary:** Blue/Purple scales
- **Dark backgrounds:** Navy (blue.900) for marketing graphics
`.trim();

// Workflow guidance as a tool annotation - this is what Claude actually sees
const WORKFLOW_GUIDANCE = `
WORKFLOW REQUIREMENT: Before calling render_graphic, you MUST:
1. Identify the graphic type (diagram/annotation/marketing)
2. Ask 3-5 clarifying questions based on type
3. Confirm requirements with user
4. Only then proceed to render

This applies even if the user provides detailed requirements - always confirm visual preferences.
`.trim();

// Intake workflow content - returned when graphic_intake prompt is invoked
const INTAKE_WORKFLOW_CONTENT = `
## Graphic Intake Workflow

Before generating any graphic, gather requirements by asking the user:

### 1. Determine Type
What type of graphic do you need?
- **diagram** - Technical flows, architecture, data pipelines
- **annotation** - Screenshot highlights, feature documentation
- **marketing** - Feature showcases, promotional graphics

### 2. Gather Inputs Based on Type

**For Diagrams, ask:**
- What nodes/elements need to be shown?
- How do they connect? (from → to relationships)
- Flow direction? (left-to-right, top-to-bottom)
- Any grouping or sections?

**For Annotations, ask:**
- Do you have a screenshot image to annotate?
- What element(s) should be highlighted?
- What text annotations are needed?

**For Marketing, ask:**
- What is the feature name/headline?
- What should be the visual focus? (icon, dashboard, code)
- Background style preference? (dark navy, green gradient, light)

### 3. Confirm Before Generating
Summarize the gathered requirements and confirm with the user before proceeding.

### 4. Generate
Once confirmed:
1. Call \`get_style_profile\` for brand tokens
2. Call \`get_pattern\` for recipe/component styles
3. Generate HTML/CSS following brand guidelines
4. Call \`render_graphic\` to output the image
`.trim();

async function main() {
  const server = new McpServer({
    name: 'h-graphic-generator',
    version: '0.1.0',
  }, {
    instructions: SERVER_INSTRUCTIONS,
  });

  // Register the graphic intake prompt
  server.registerPrompt(
    'graphic_intake',
    {
      title: 'Start Graphic Creation',
      description: 'Begin the graphic creation workflow by gathering requirements. Use this before calling render_graphic.',
      argsSchema: {
        type: z.enum(['diagram', 'annotation', 'marketing']).optional().describe('Type of graphic'),
        description: z.string().optional().describe('Initial description of what the user wants'),
      },
    },
    async (args) => {
      const typeInfo = args.type ? `\n\n**Selected type:** ${args.type}` : '';
      const descInfo = args.description ? `\n**User request:** ${args.description}` : '';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `${INTAKE_WORKFLOW_CONTENT}${typeInfo}${descInfo}\n\nNow ask the user the relevant questions for their graphic type before proceeding to generate.`,
            },
          },
        ],
      };
    }
  );

  // Load brand config once at startup (shared across all handlers)
  const brandConfigPath = path.join(PROJECT_ROOT, 'brand/brand.json');
  const brandContext = await BrandContext.load(brandConfigPath);

  // Load Figma extractions (optional - gracefully handle if not present)
  let extractionLoader: ExtractionLoader | undefined;
  try {
    const extractedDir = path.join(PROJECT_ROOT, 'brand/extracted');
    extractionLoader = await ExtractionLoader.load(extractedDir);
  } catch {
    console.error('Warning: Could not load extractions from brand/extracted/');
  }

  // Load composable component system (Option B architecture)
  let componentLoader: ComponentLoader | undefined;
  try {
    const brandDir = path.join(PROJECT_ROOT, 'brand');
    componentLoader = await ComponentLoader.load(brandDir);
  } catch {
    console.error('Warning: Could not load components from brand/components/');
  }

  // Register all tools and resources
  registerTools(server, brandContext, extractionLoader, componentLoader);
  registerResources(server, brandContext);

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server error:', error);
  process.exit(1);
});

# Graphic Intake Brief

## Step 1: Declare Intent

What type of graphic are you creating?

| Type | Description | Recipes |
|------|-------------|---------|
| **diagram** | Technical flows, architecture, data pipelines | `diagrams/architecture-flow`, `diagrams/data-flow` |
| **annotation** | Screenshot highlights, feature documentation | `annotations/screenshot-highlight` |
| **marketing** | Feature showcases, promotional graphics | `marketing/spotlight-feature`, `marketing/layered-showcase`, `marketing/config-preview`, `marketing/radial-network` |

## Step 2: Required Inputs

### For Diagrams
1. What nodes/elements need to be shown?
2. How do they connect? (from → to)
3. Any grouping or sections?
4. Flow direction? (left-to-right, top-to-bottom)
5. Step sequence needed?

### For Annotations
1. Screenshot image provided?
2. What element(s) to highlight?
3. Text annotations needed?
4. Cursor interaction to show?

### For Marketing
1. Feature name/headline?
2. Visual focus (icon, dashboard, code)?
3. Background style (dark navy, green gradient)?
4. CTA button needed?

## Step 3: Pattern Match

Based on inputs, select recipe:

| Input Pattern | Recipe |
|---------------|--------|
| Service connections, API flows | `diagrams/architecture-flow` |
| ETL, transformations, filtering | `diagrams/data-flow` |
| Real UI screenshot + highlight | `annotations/screenshot-highlight` |
| Single feature icon promotion | `marketing/spotlight-feature` |
| Dashboard tabs, multi-window | `marketing/layered-showcase` |
| Code/config → visual result | `marketing/config-preview` |
| Network, ecosystem, referral | `marketing/radial-network` |

## Step 4: Confirm Structure

Before generating, confirm:
- [ ] Layout direction/composition understood
- [ ] All nodes/elements listed
- [ ] Connections/relationships clear
- [ ] Color scheme appropriate (docs=light, marketing=dark)
- [ ] Typography scale correct

## Step 5: Generate

1. Load recipe from `brand/recipes/`
2. Load referenced components from `brand/components/`
3. Load SVGs from `brand/svg/` as needed
4. Apply brand tokens from `brand/brand.json`
5. Generate HTML/CSS following recipe construction steps
6. Render via `render_graphic` MCP tool

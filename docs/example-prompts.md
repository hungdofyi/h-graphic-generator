# Example Prompts for h-graphic MCP

Realistic prompts for Holistics product graphics.

---

## Exporting to Figma

To add graphics to an existing Figma file, include the Figma URL in your prompt:

| Output Mode | Prompt Style |
|-------------|--------------|
| New file | "Create X and export to Figma" |
| Existing file | "Create X and add to `figma.com/design/{fileKey}/...`" |
| Specific page | "Create X and add to `figma.com/design/{fileKey}/...?node-id=1:234`" |

**Examples:**
```
# Creates new Figma file
Create a semantic layer diagram and export to Figma

# Adds to existing file
Create a semantic layer diagram and add to figma.com/design/abc123/Holistics-Diagrams

# Adds to specific page in file
Create a semantic layer diagram and add to figma.com/design/abc123/Holistics-Diagrams?node-id=5:100
```

---

## Prompting Strategy

> **Best practice**: Start with a minimal prompt. The AI asks clarifying questions which produce better-styled output than fully-specified prompts.

| Style | Example | What Happens |
|-------|---------|--------------|
| **Minimal** | "Create a diagram showing semantic layer" | AI asks about nodes, flow, style → best output |
| **Moderate** | "Semantic layer flow: Data → Models → Metrics → Dashboards" | AI asks 1-2 style questions |
| **Detailed** | Full spec with dimensions, colors, output path | AI proceeds directly → acceptable output |

Each example below shows **both styles** with expected Q&A for minimal prompts.

---

## Semantic Layer & Data Modeling

### Semantic Layer Flow

**Minimal prompt:**
```
Show how the semantic layer works
```

**AI will ask → Your answers:**
- Type? → Diagram
- What nodes? → Raw Data, Data Models, Metrics, Dashboards
- How connected? → Linear flow: Raw Data → Data Models → Metrics → Dashboards
- Direction? → Left to right
- Size/output? → 1400x600, output/semantic-layer-flow.png

**Detailed prompt (skips questions):**
```
Show how the semantic layer works: Raw Data → Data Models → Metrics → Dashboards.
Use a clean flow with 4 connected boxes. 1400x600 PNG, output/semantic-layer-flow.png
```

---

### Traditional BI vs Holistics

**Minimal prompt:**
```
Create a comparison graphic for traditional BI vs Holistics approach
```

**AI will ask → Your answers:**
- Type? → Diagram (comparison/before-after)
- Left side content? → Scattered SQL queries, inconsistent metrics, siloed data
- Right side content? → Centralized semantic layer, single source of truth, governed metrics
- Visual style? → Side-by-side panels, left showing chaos, right showing order
- Size/output? → 1600x800, output/traditional-vs-holistics.png

**Detailed prompt:**
```
Create a diagram comparing traditional BI vs Holistics approach.
Left side: Scattered SQL queries, inconsistent metrics.
Right side: Centralized semantic layer, single source of truth.
1600x800, output/traditional-vs-holistics.png
```

---

### AML Concept

**Minimal prompt:**
```
Illustrate the AML code-to-visual concept
```

**AI will ask → Your answers:**
- Type? → Diagram (code preview style)
- What to show? → Code on left, visual output on right
- Code example? → Simple model definition (dimension, measure)
- Visual result? → Bar chart or metric card
- Size/output? → 1400x700 PNG, output/aml-concept.png

**Detailed prompt:**
```
Illustrate AML (Analytics Markup Language) concept - code on left, visual output on right.
Show a simple model definition transforming into a chart.
1400x700 PNG, output/aml-concept.png
```

---

## Self-Service Analytics

### Self-Service Journey

**Minimal prompt:**
```
Design a graphic showing the self-service analytics journey
```

**AI will ask → Your answers:**
- Type? → Diagram
- What steps? → Business User asks question → AI suggests datasets → User builds report → Shares insights
- Flow direction? → Left to right, horizontal
- Style? → Clean steps with icons
- Size/output? → 1600x500, output/self-service-journey.png

---

### Before/After Self-Service

**Minimal prompt:**
```
Show before and after self-service analytics
```

**AI will ask → Your answers:**
- Type? → Diagram (before/after comparison)
- Before state? → Business user waiting for analyst, long queue, frustrated
- After state? → Business user exploring data independently with pre-built datasets
- Visual style? → Two panels, left darker/frustrated, right brighter/empowered
- Size/output? → 1400x800, output/self-service-before-after.png

---

### Drill-Down Capability

**Minimal prompt:**
```
Show drill-down capability in dashboards
```

**AI will ask → Your answers:**
- Type? → Diagram (interaction flow)
- What stages? → Overview dashboard → Click metric → Detailed breakdown → Raw data
- Visual focus? → Show zooming in / expanding detail at each step
- Size/output? → 1500x600, output/drill-down-flow.png

---

## Analytics-as-Code

### Git Workflow

**Minimal prompt:**
```
Illustrate Git workflow for analytics
```

**AI will ask → Your answers:**
- Type? → Diagram
- What steps? → Branch → Edit models → Pull Request → Review → Deploy to production
- Flow direction? → Left to right, pipeline style
- Size/output? → 1600x500 PNG, output/git-workflow-analytics.png

---

### Version Control Benefits

**Minimal prompt:**
```
Show version control benefits for analytics
```

**AI will ask → Your answers:**
- Type? → Diagram (feature showcase)
- What benefits? → Track changes, Rollback, Collaborate
- Layout? → Three columns with icons and short descriptions
- Size/output? → 1200x600, output/version-control-benefits.png

---

### CI/CD Pipeline

**Minimal prompt:**
```
Create a CI/CD pipeline graphic for analytics
```

**AI will ask → Your answers:**
- Type? → Diagram
- What stages? → Code Push → Automated Tests → Staging → Production
- Style? → Pipeline with connected stages
- Size/output? → 1400x400, output/analytics-cicd.png

---

## Data Modeling Concepts

### Model Relationships

**Minimal prompt:**
```
Diagram showing model relationships
```

**AI will ask → Your answers:**
- Type? → Diagram
- What models? → Users, Orders, Products
- Relationships? → Users → Orders (has many), Orders → Products (belongs to)
- Show join type? → Yes, indicate the relationship type on connectors
- Size/output? → 1200x700, output/model-relationships.png

---

### Dimensions vs Measures

**Minimal prompt:**
```
Explain dimensions vs measures concept visually
```

**AI will ask → Your answers:**
- Type? → Diagram (concept explanation)
- Examples for dimensions? → Country, Product, Date (categorical)
- Examples for measures? → Revenue, Count, Average (numerical)
- Layout? → Two columns or side-by-side boxes
- Size/output? → 1000x600, output/dimensions-vs-measures.png

---

### Derived Models

**Minimal prompt:**
```
Show derived model concept
```

**AI will ask → Your answers:**
- Type? → Diagram
- What flow? → Base tables → Transformations → Derived model ready for analysis
- Visual style? → Show transformation/processing in middle
- Size/output? → 1400x500, output/derived-models.png

---

## Dashboard & Visualization

### Canvas Dashboard Preview

**Minimal prompt:**
```
Create a Canvas Dashboard preview
```

**AI will ask → Your answers:**
- Type? → Marketing (dashboard mockup)
- What elements? → Title, KPI cards at top, charts in middle, text annotations, filters on side
- Style? → Clean, modern dashboard layout
- Size/output? → 1600x900, output/canvas-dashboard-preview.png

---

### Filter Inheritance

**Minimal prompt:**
```
Show filter inheritance flow in dashboards
```

**AI will ask → Your answers:**
- Type? → Diagram
- What flow? → Dashboard filter → Applied to all widgets → Consistent data view
- Visual focus? → Show filter propagating to multiple widgets
- Size/output? → 1200x500, output/filter-inheritance.png

---

### Cross-Filtering Interaction

**Minimal prompt:**
```
Illustrate cross-filtering interaction
```

**AI will ask → Your answers:**
- Type? → Diagram (interaction flow)
- What interaction? → Click on bar chart → Other charts update → Related data highlighted
- Visual style? → Show the click action and resulting updates
- Size/output? → 1400x600, output/cross-filtering.png

---

## Data Delivery & Scheduling

### Delivery Options

**Minimal prompt:**
```
Show automated report delivery options
```

**AI will ask → Your answers:**
- Type? → Diagram
- What destinations? → Email, Slack, Google Sheets, SFTP
- Layout? → Dashboard in center, fan-out to destinations
- Size/output? → 1200x600, output/delivery-options.png

---

### Data Alert Flow

**Minimal prompt:**
```
Create a data alert flow
```

**AI will ask → Your answers:**
- Type? → Diagram
- What steps? → Metric threshold set → Data exceeds limit → Alert triggered → Notification sent
- Style? → Linear flow with condition/trigger highlight
- Size/output? → 1400x400, output/data-alert-flow.png

---

## Permissions & Security

### Row-Level Security

**Minimal prompt:**
```
Illustrate row-level security
```

**AI will ask → Your answers:**
- Type? → Diagram
- What to show? → Same dashboard, different users see different data based on permissions
- Layout? → 3 user views side by side with different visible data
- Size/output? → 1600x600, output/row-level-security.png

---

### Permission Hierarchy

**Minimal prompt:**
```
Show permission hierarchy
```

**AI will ask → Your answers:**
- Type? → Diagram
- What levels? → Organization → Workspace → Folder → Report → Data (columns/rows)
- Layout? → Nested boxes showing containment
- Size/output? → 1200x700, output/permission-hierarchy.png

---

## Embedded Analytics

### Embedded Flow

**Minimal prompt:**
```
Show embedded analytics flow
```

**AI will ask → Your answers:**
- Type? → Diagram
- What flow? → Holistics Dashboard → Embed Code → Customer's App displaying the chart
- Visual style? → Show code snippet in middle, app mockup on right
- Size/output? → 1400x500, output/embedded-flow.png

---

### White-Label Concept

**Minimal prompt:**
```
Create white-label concept graphic
```

**AI will ask → Your answers:**
- Type? → Marketing (showcase)
- What to show? → Same dashboard with different brand colors for different clients
- How many variations? → 3 variations side by side
- Size/output? → 1500x600, output/white-label-concept.png

---

## AI Features

### AI-Assisted Analytics

**Minimal prompt:**
```
Illustrate AI-assisted analytics
```

**AI will ask → Your answers:**
- Type? → Diagram
- What flow? → User types natural language question → AI interprets → Suggests relevant dataset → Shows answer
- Visual style? → Conversational UI style, chat-like
- Size/output? → 1600x500, output/ai-assisted-flow.png

---

### AI Transparency

**Minimal prompt:**
```
Show AI transparency concept
```

**AI will ask → Your answers:**
- Type? → Diagram
- What concept? → AI suggestion shown alongside the actual SQL/logic used
- Key message? → "Not a black box" - user can verify
- Size/output? → 1200x600, output/ai-transparency.png

---

## Integration & Architecture

### Modern Data Stack

**Minimal prompt:**
```
Create a modern data stack diagram
```

**AI will ask → Your answers:**
- Type? → Diagram (architecture)
- What layers? → Data Sources → ETL/dbt → Data Warehouse → Holistics → Business Users
- Flow direction? → Horizontal, left to right
- Size/output? → 1800x500, output/modern-data-stack.png

---

### dbt + Holistics Integration

**Minimal prompt:**
```
Show dbt and Holistics integration
```

**AI will ask → Your answers:**
- Type? → Diagram
- What relationship? → dbt handles transformation, Holistics handles semantic layer + visualization
- Layout? → Two connected boxes showing responsibilities
- Size/output? → 1400x600, output/dbt-holistics.png

---

### Data Source Connections

**Minimal prompt:**
```
Illustrate data source connections
```

**AI will ask → Your answers:**
- Type? → Diagram
- What sources? → Postgres, BigQuery, Snowflake, Redshift
- Layout? → Hub and spoke - databases around Holistics in center
- Size/output? → 1200x800, output/data-sources.png

---

## Feature Highlights

### Metrics Sheet

**Minimal prompt:**
```
Create a metrics sheet preview
```

**AI will ask → Your answers:**
- Type? → Marketing (dashboard preview)
- What KPIs? → Revenue, Users, Conversion, Retention
- Visual elements? → Sparklines, period comparisons
- Size/output? → 1400x800, output/metrics-sheet.png

---

### Cohort Retention Heatmap

**Minimal prompt:**
```
Show cohort retention heatmap concept
```

**AI will ask → Your answers:**
- Type? → Diagram (chart concept)
- What axes? → Weeks on X-axis, cohorts on Y-axis
- Visual style? → Color intensity showing retention percentage
- Size/output? → 1200x700, output/cohort-heatmap.png

---

### Funnel Conversion

**Minimal prompt:**
```
Illustrate funnel conversion visualization
```

**AI will ask → Your answers:**
- Type? → Diagram
- What stages? → Visitors → Signups → Activated → Paid
- Show drop-offs? → Yes, with percentages between stages
- Size/output? → 1000x600, output/funnel-conversion.png

---

## Simple Icon Graphics

### Data Catalog Icon

**Minimal prompt:**
```
Create a simple icon for Data Catalog
```

**AI will ask → Your answers:**
- Type? → Diagram (icon)
- Concept? → Organized data with search element
- Size/output? → 512x512 PNG, output/icon-data-catalog.png

---

### Data Lineage Icon

**Minimal prompt:**
```
Design an icon for Data Lineage
```

**AI will ask → Your answers:**
- Type? → Diagram (icon)
- Concept? → Connected nodes showing data flow/ancestry
- Size/output? → 512x512, output/icon-data-lineage.png

---

### Scheduled Reports Icon

**Minimal prompt:**
```
Make an icon for Scheduled Reports
```

**AI will ask → Your answers:**
- Type? → Diagram (icon)
- Concept? → Calendar + chart combination
- Size/output? → 512x512 PNG, output/icon-scheduled-reports.png

---

## Marketing Banners

### Feature Announcement

**Minimal prompt:**
```
Create a feature announcement banner for AI-Assisted Data Exploration
```

**AI will ask → Your answers:**
- Type? → Marketing
- Headline? → "New: AI-Assisted Data Exploration"
- Visual focus? → Subtle AI/sparkle visual
- Background? → Dark navy (marketing style)
- Size/output? → 1200x630 for social sharing, output/ai-feature-banner.png

---

### Blog Header

**Minimal prompt:**
```
Design a blog header for semantic layer article
```

**AI will ask → Your answers:**
- Type? → Marketing
- Title? → "Why Semantic Layer Matters"
- Visual style? → Abstract data visualization with clean typography
- Size/output? → 1200x630, output/blog-semantic-layer.png

---

### OG Image

**Minimal prompt:**
```
Make an og:image for Analytics-as-Code guide
```

**AI will ask → Your answers:**
- Type? → Marketing
- Title? → "Getting Started with Analytics-as-Code"
- Visual style? → Code editor aesthetic with Holistics branding
- Size/output? → 1200x630, output/og-analytics-as-code.png

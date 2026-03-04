import fs from 'node:fs/promises';
import path from 'node:path';
import { GeminiClient } from './gemini-client.js';
import {
  validateReferencesPath,
  isSymlink,
  loadValidatedImage,
  MAX_IMAGES,
} from './image-validation.js';
import {
  type StyleProfile,
  type CategoryStyleProfile,
  type GlobalStyleProfile,
  RelaxedCategoryStyleProfileSchema,
  RelaxedGlobalStyleProfileSchema,
} from './style-profile-types.js';

/**
 * Per-category analysis prompt
 */
const CATEGORY_PROMPT = (category: string) => `
Analyze these ${category} graphics from a brand design system.
Describe with specificity:
1. Composition and layout patterns (alignment, spacing, visual hierarchy)
2. How colors are applied (not what colors — how they're used for emphasis, backgrounds, accents)
3. Typography hierarchy and text styling patterns
4. Decorative elements (borders, shadows, shapes, icons)
5. Illustration/graphic style (flat, 3D, outlined, gradient usage)

Be VERY specific and actionable — another AI will use this to generate visually consistent graphics.
Output ONLY valid JSON (no markdown, no explanation):
{
  "composition": "detailed description...",
  "colorUsage": "detailed description...",
  "elements": "detailed description...",
  "layout": "detailed description..."
}
`;

/**
 * Synthesis prompt for global patterns
 */
const SYNTHESIS_PROMPT = (categorySummaries: string) => `
Given these per-category style analyses from a brand's visual design system:

${categorySummaries}

Identify global patterns across ALL categories. Be specific and actionable.
Output ONLY valid JSON:
{
  "colorApplication": {
    "primaryUsage": "how primary color is used...",
    "accentUsage": "how accent colors are used...",
    "backgroundPatterns": "how backgrounds are styled..."
  },
  "typographyHierarchy": {
    "headingStyle": "how headings are styled...",
    "bodyStyle": "how body text is styled...",
    "emphasisPatterns": "how emphasis is applied..."
  },
  "spacingRhythm": "consistent spacing patterns...",
  "decorativeElements": ["element1", "element2"],
  "illustrationStyle": "overall visual approach...",
  "overallMood": "professional yet approachable..."
}
`;

interface ExtractOptions {
  referencesDir: string;
  outputDir: string;
  model?: string;
  onProgress?: (message: string) => void;
}

/**
 * Style extraction orchestrator
 */
export class StyleExtractor {
  private gemini: GeminiClient;

  constructor() {
    this.gemini = new GeminiClient();
  }

  /**
   * Extract style profile from reference images
   */
  async extract(options: ExtractOptions): Promise<StyleProfile> {
    const { referencesDir, outputDir, model, onProgress } = options;
    const log = onProgress || console.log;

    // 1. Validate paths
    const validatedRefsDir = validateReferencesPath(referencesDir);
    log(`Scanning ${validatedRefsDir}...`);

    // 2. Scan for category subdirectories
    const categories = await this.scanCategories(validatedRefsDir);
    if (categories.length === 0) {
      throw new Error('No category subdirectories found in references directory');
    }
    log(`Found ${categories.length} categories: ${categories.join(', ')}`);

    // 3. Collect all images (with cap)
    const categoryImages = new Map<string, Buffer[]>();
    let totalImages = 0;

    for (const category of categories) {
      const images = await this.loadCategoryImages(
        path.join(validatedRefsDir, category),
        MAX_IMAGES - totalImages
      );
      if (images.length > 0) {
        categoryImages.set(category, images);
        totalImages += images.length;
        log(`  ${category}: ${images.length} images`);
      }
      if (totalImages >= MAX_IMAGES) break;
    }

    if (totalImages === 0) {
      throw new Error('No valid images found in references directory');
    }
    log(`Total: ${totalImages} images`);

    // 4. Analyze each category
    const categoryAnalyses = new Map<string, CategoryStyleProfile>();

    for (const [category, images] of categoryImages) {
      log(`\nAnalyzing ${category}...`);
      const analysis = await this.analyzeCategory(category, images, model);
      categoryAnalyses.set(category, analysis);
      log(`  ✓ ${category} analyzed`);
    }

    // 5. Run synthesis pass
    log('\nSynthesizing global patterns...');
    const global = await this.synthesize(categoryAnalyses, model);
    log('  ✓ Global patterns extracted');

    // 6. Build profile
    const profile: StyleProfile = {
      $schema: 'h-graphic-style-v1',
      extractedFrom: {
        imageCount: totalImages,
        categories: Array.from(categoryImages.keys()),
        extractedAt: new Date().toISOString(),
      },
      global,
      categories: Object.fromEntries(categoryAnalyses),
    };

    // 7. Write outputs (atomic)
    const jsonPath = path.join(outputDir, 'style-profile.json');
    const mdPath = path.join(outputDir, 'style-profile.md');

    await this.atomicWrite(jsonPath, JSON.stringify(profile, null, 2));
    await this.atomicWrite(mdPath, this.generateMarkdown(profile));

    log(`\n✓ Written: ${jsonPath}`);
    log(`✓ Written: ${mdPath}`);

    return profile;
  }

  /**
   * Scan for category subdirectories
   */
  private async scanCategories(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const categories: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const fullPath = path.join(dir, entry.name);
        if (!(await isSymlink(fullPath))) {
          categories.push(entry.name);
        }
      }
    }

    return categories;
  }

  /**
   * Load validated images from a category directory
   */
  private async loadCategoryImages(dir: string, maxCount: number): Promise<Buffer[]> {
    const entries = await fs.readdir(dir);
    const images: Buffer[] = [];

    for (const entry of entries) {
      if (images.length >= maxCount) break;

      const ext = path.extname(entry).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) continue;

      const fullPath = path.join(dir, entry);
      if (await isSymlink(fullPath)) continue;

      const result = await loadValidatedImage(fullPath);
      if (result) {
        images.push(result.buffer);
      }
    }

    return images;
  }

  /**
   * Analyze a category with batched images
   */
  private async analyzeCategory(
    category: string,
    images: Buffer[],
    model?: string
  ): Promise<CategoryStyleProfile> {
    // Batch images (3-5 per request)
    const batchSize = Math.min(5, images.length);
    const batch = images.slice(0, batchSize);

    const prompt = CATEGORY_PROMPT(category);

    // Try up to 3 times
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await this.gemini.analyzeImages<CategoryStyleProfile>(
          batch,
          prompt,
          model
        );

        // Validate with relaxed schema
        const parsed = RelaxedCategoryStyleProfileSchema.parse(result);
        return parsed;
      } catch (error) {
        if (attempt === 2) {
          // Return placeholder on final failure
          return {
            composition: `Unable to analyze ${category} composition after 3 attempts`,
            colorUsage: `Unable to analyze ${category} color usage after 3 attempts`,
            elements: `Unable to analyze ${category} elements after 3 attempts`,
            layout: `Unable to analyze ${category} layout after 3 attempts`,
          };
        }
      }
    }

    // Should never reach here
    throw new Error('Unexpected error in category analysis');
  }

  /**
   * Synthesize global patterns from all category analyses
   */
  private async synthesize(
    categoryAnalyses: Map<string, CategoryStyleProfile>,
    model?: string
  ): Promise<GlobalStyleProfile> {
    // Build summary string
    const summaries = Array.from(categoryAnalyses.entries())
      .map(([cat, analysis]) => `## ${cat}\n${JSON.stringify(analysis, null, 2)}`)
      .join('\n\n');

    const prompt = SYNTHESIS_PROMPT(summaries);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await this.gemini.textPrompt<GlobalStyleProfile>(prompt, model);
        const parsed = RelaxedGlobalStyleProfileSchema.parse(result);
        return parsed;
      } catch (error) {
        if (attempt === 2) {
          // Return placeholder
          return {
            colorApplication: {
              primaryUsage: 'Unable to synthesize after 3 attempts',
              accentUsage: 'Unable to synthesize after 3 attempts',
              backgroundPatterns: 'Unable to synthesize after 3 attempts',
            },
            typographyHierarchy: {
              headingStyle: 'Unable to synthesize after 3 attempts',
              bodyStyle: 'Unable to synthesize after 3 attempts',
              emphasisPatterns: 'Unable to synthesize after 3 attempts',
            },
            spacingRhythm: 'Unable to synthesize after 3 attempts',
            decorativeElements: [],
            illustrationStyle: 'Unable to synthesize after 3 attempts',
            overallMood: 'Unable to synthesize',
          };
        }
      }
    }

    throw new Error('Unexpected error in synthesis');
  }

  /**
   * Atomic file write (write to tmp, then rename)
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tmpPath = filePath + '.tmp';
    await fs.writeFile(tmpPath, content, 'utf-8');
    await fs.rename(tmpPath, filePath);
  }

  /**
   * Generate human-readable markdown from profile
   */
  private generateMarkdown(profile: StyleProfile): string {
    const lines: string[] = [
      '# Brand Style Profile',
      '',
      '> This file was auto-generated by `hgraphic brand extract-style`.',
      '> You can edit it to fine-tune the style guidance for AI graphic generation.',
      '',
      `**Extracted:** ${profile.extractedFrom.extractedAt}`,
      `**Images analyzed:** ${profile.extractedFrom.imageCount}`,
      `**Categories:** ${profile.extractedFrom.categories.join(', ')}`,
      '',
      '---',
      '',
      '## Global Patterns',
      '',
      '### Color Application',
      `- **Primary usage:** ${profile.global.colorApplication.primaryUsage}`,
      `- **Accent usage:** ${profile.global.colorApplication.accentUsage}`,
      `- **Background patterns:** ${profile.global.colorApplication.backgroundPatterns}`,
      '',
      '### Typography Hierarchy',
      `- **Heading style:** ${profile.global.typographyHierarchy.headingStyle}`,
      `- **Body style:** ${profile.global.typographyHierarchy.bodyStyle}`,
      `- **Emphasis patterns:** ${profile.global.typographyHierarchy.emphasisPatterns}`,
      '',
      '### Other Patterns',
      `- **Spacing rhythm:** ${profile.global.spacingRhythm}`,
      `- **Decorative elements:** ${profile.global.decorativeElements.join(', ') || 'None identified'}`,
      `- **Illustration style:** ${profile.global.illustrationStyle}`,
      `- **Overall mood:** ${profile.global.overallMood}`,
      '',
      '---',
      '',
      '## Per-Category Analysis',
      '',
    ];

    for (const [category, analysis] of Object.entries(profile.categories)) {
      lines.push(`### ${category}`);
      lines.push('');
      lines.push(`- **Composition:** ${analysis.composition}`);
      lines.push(`- **Color usage:** ${analysis.colorUsage}`);
      lines.push(`- **Elements:** ${analysis.elements}`);
      lines.push(`- **Layout:** ${analysis.layout}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}

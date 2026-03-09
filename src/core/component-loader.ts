import fs from 'node:fs/promises';
import path from 'node:path';

export interface ComponentVariant {
  [key: string]: unknown;
}

export interface Component {
  $schema: string;
  name: string;
  description: string;
  category: string;
  variants?: Record<string, ComponentVariant>;
  [key: string]: unknown;
}

export interface Recipe {
  name: string;
  category: string;
  content: string;
  path: string;
}

export interface ComponentSummary {
  category: string;
  name: string;
  description: string;
  variantCount: number;
  path: string;
}

export interface RecipeSummary {
  category: string;
  name: string;
  path: string;
}

/**
 * Loads composable component system (Option B architecture)
 * - Components: brand/components/{category}/{name}.json
 * - Recipes: brand/recipes/{category}/{name}.md
 * - SVGs: brand/svg/{category}/{name}.svg
 */
export class ComponentLoader {
  private components: Map<string, Component> = new Map();
  private recipes: Map<string, Recipe> = new Map();
  private brandDir: string;

  private constructor(brandDir: string) {
    this.brandDir = path.resolve(brandDir);
  }

  /**
   * Load all components and recipes from brand directory
   */
  static async load(brandDir = 'brand'): Promise<ComponentLoader> {
    const loader = new ComponentLoader(brandDir);
    await loader.loadComponents();
    await loader.loadRecipes();
    return loader;
  }

  private async loadComponents(): Promise<void> {
    const componentsDir = path.join(this.brandDir, 'components');

    try {
      const categories = await fs.readdir(componentsDir, { withFileTypes: true });

      for (const category of categories) {
        if (!category.isDirectory()) continue;

        const categoryDir = path.join(componentsDir, category.name);
        const files = await fs.readdir(categoryDir, { withFileTypes: true });

        for (const file of files) {
          if (!file.isFile() || !file.name.endsWith('.json')) continue;

          const filePath = path.join(categoryDir, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content) as Component;

          // Only load v1 component schema
          if (data.$schema !== 'h-graphic-component-v1') continue;

          const key = `${category.name}/${data.name}`;
          this.components.set(key, data);
        }
      }
    } catch {
      // Components directory may not exist yet
    }
  }

  private async loadRecipes(): Promise<void> {
    const recipesDir = path.join(this.brandDir, 'recipes');

    try {
      const categories = await fs.readdir(recipesDir, { withFileTypes: true });

      for (const category of categories) {
        if (!category.isDirectory()) continue;

        const categoryDir = path.join(recipesDir, category.name);
        const files = await fs.readdir(categoryDir, { withFileTypes: true });

        for (const file of files) {
          if (!file.isFile() || !file.name.endsWith('.md')) continue;

          const filePath = path.join(categoryDir, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          const name = file.name.replace('.md', '');

          const key = `${category.name}/${name}`;
          this.recipes.set(key, {
            name,
            category: category.name,
            content,
            path: filePath,
          });
        }
      }
    } catch {
      // Recipes directory may not exist yet
    }
  }

  /**
   * List all available components
   */
  listComponents(): ComponentSummary[] {
    const summaries: ComponentSummary[] = [];

    for (const [key, component] of this.components) {
      const category = key.split('/')[0] || 'unknown';
      summaries.push({
        category,
        name: component.name,
        description: component.description,
        variantCount: component.variants ? Object.keys(component.variants).length : 0,
        path: `components/${key}.json`,
      });
    }

    return summaries.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  /**
   * List components by category
   */
  listComponentsByCategory(category: string): ComponentSummary[] {
    return this.listComponents().filter(c => c.category === category);
  }

  /**
   * Get a specific component
   */
  getComponent(key: string): Component | null {
    // Try exact key first
    if (this.components.has(key)) {
      return this.components.get(key)!;
    }

    // Try finding by name across categories
    for (const [k, component] of this.components) {
      if (k.endsWith(`/${key}`) || component.name === key) {
        return component;
      }
    }

    return null;
  }

  /**
   * List all available recipes
   */
  listRecipes(): RecipeSummary[] {
    const summaries: RecipeSummary[] = [];

    for (const [key, recipe] of this.recipes) {
      summaries.push({
        category: recipe.category,
        name: recipe.name,
        path: `recipes/${key}.md`,
      });
    }

    return summaries.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  /**
   * List recipes by category
   */
  listRecipesByCategory(category: string): RecipeSummary[] {
    return this.listRecipes().filter(r => r.category === category);
  }

  /**
   * Get a specific recipe
   */
  getRecipe(key: string): Recipe | null {
    // Try exact key first
    if (this.recipes.has(key)) {
      return this.recipes.get(key)!;
    }

    // Try finding by name across categories
    for (const [k, recipe] of this.recipes) {
      if (k.endsWith(`/${key}`) || recipe.name === key) {
        return recipe;
      }
    }

    return null;
  }

  /**
   * Get all component categories
   */
  getComponentCategories(): string[] {
    const categories = new Set<string>();
    for (const [key] of this.components) {
      const category = key.split('/')[0];
      if (category) categories.add(category);
    }
    return [...categories].sort();
  }

  /**
   * Get all recipe categories
   */
  getRecipeCategories(): string[] {
    const categories = new Set<string>();
    for (const recipe of this.recipes.values()) {
      categories.add(recipe.category);
    }
    return [...categories].sort();
  }

  /**
   * Get SVG path for a component reference
   */
  getSvgPath(svgRef: string): string {
    return path.join(this.brandDir, svgRef);
  }

  /**
   * Get SVG content for a component's svgTemplate
   * Returns the raw SVG string that can be embedded in HTML
   */
  async getSvgContent(svgRef: string): Promise<string | null> {
    try {
      const svgPath = this.getSvgPath(svgRef);
      const content = await fs.readFile(svgPath, 'utf-8');
      return content.trim();
    } catch {
      return null;
    }
  }

  /**
   * Get component with embedded SVG content
   * If component has svgTemplate, includes the actual SVG markup
   */
  async getComponentWithSvg(key: string): Promise<(Component & { svgContent?: string }) | null> {
    const component = this.getComponent(key);
    if (!component) return null;

    // If component has svgTemplate, fetch the content
    const svgTemplate = component['svgTemplate'];
    if (svgTemplate && typeof svgTemplate === 'string') {
      const svgContent = await this.getSvgContent(svgTemplate);
      return {
        ...component,
        svgContent: svgContent || undefined,
      };
    }

    return component;
  }

  /**
   * Check if components are loaded
   */
  hasComponents(): boolean {
    return this.components.size > 0;
  }

  /**
   * Check if recipes are loaded
   */
  hasRecipes(): boolean {
    return this.recipes.size > 0;
  }
}

import type { Template, TemplateCategory } from '../core/types.js';
import { featureIllustration } from './feature-illustration/index.js';
import { processSteps } from './process-steps/index.js';
import { conceptComparison } from './concept-comparison/index.js';
import { linearFlow } from './linear-flow/index.js';

/**
 * Template registry for discovering and accessing templates
 */
class TemplateRegistry {
  private templates = new Map<string, Template>();

  /**
   * Register a template
   */
  register(template: Template): void {
    this.templates.set(template.name, template);
  }

  /**
   * Get a template by name
   */
  get(name: string): Template | undefined {
    return this.templates.get(name);
  }

  /**
   * List all templates, optionally filtered by category
   */
  list(category?: TemplateCategory): Template[] {
    const all = Array.from(this.templates.values());
    if (!category) return all;
    return all.filter((t) => t.category === category);
  }

  /**
   * Check if a template exists
   */
  has(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Get template count
   */
  get size(): number {
    return this.templates.size;
  }
}

// Singleton registry instance
export const registry = new TemplateRegistry();

/**
 * Register all built-in templates
 * Called at startup to populate registry
 */
export function registerBuiltinTemplates(): void {
  registry.register(featureIllustration);
  registry.register(processSteps);
  registry.register(conceptComparison);
  registry.register(linearFlow);
}

// Auto-register on import
registerBuiltinTemplates();

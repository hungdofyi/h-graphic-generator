import fs from 'node:fs/promises';
import path from 'node:path';
import type { BrandConfig, BrandTypography } from './types.js';
import type { StyleProfile } from './style-profile-types.js';

/**
 * Brand context loader and resolver
 * Loads brand.json and provides methods to access brand tokens
 */
export class BrandContext {
  private config: BrandConfig;
  private configPath: string;
  private styleProfile: StyleProfile | null = null;

  private constructor(config: BrandConfig, configPath: string) {
    this.config = config;
    this.configPath = configPath;
  }

  /**
   * Load and validate brand configuration from file
   * @param configPath Path to brand.json (default: brand/brand.json)
   */
  static async load(configPath: string = 'brand/brand.json'): Promise<BrandContext> {
    const resolvedPath = path.resolve(configPath);

    let content: string;
    try {
      content = await fs.readFile(resolvedPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read brand config at "${resolvedPath}": ${(error as Error).message}`);
    }

    let config: BrandConfig;
    try {
      config = JSON.parse(content) as BrandConfig;
    } catch (error) {
      throw new Error(`Invalid JSON in brand config: ${(error as Error).message}`);
    }

    // Validate required fields
    BrandContext.validate(config);

    return new BrandContext(config, resolvedPath);
  }

  /**
   * Validate brand config has required fields
   */
  private static validate(config: BrandConfig): void {
    const errors: string[] = [];

    if (!config.name) {
      errors.push('Missing required field: name');
    }

    if (!config.colors?.['primary']?.value) {
      errors.push('Missing required field: colors.primary.value');
    }

    if (!config.colors?.['text']?.value) {
      errors.push('Missing required field: colors.text.value');
    }

    const typo = config.typography as Record<string, unknown> | undefined;
    if (!typo?.['fonts'] && !typo?.['body'] && !typo?.['scales']) {
      errors.push('Missing required field: typography (fonts, body, or scales)');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid brand config:\n  - ${errors.join('\n  - ')}`);
    }
  }

  /**
   * Get full brand configuration
   */
  getConfig(): BrandConfig {
    return this.config;
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Resolve color by semantic name
   * @returns Hex color value or undefined if not found
   */
  resolveColor(name: string): string | undefined {
    return this.config.colors[name]?.value;
  }

  /**
   * Resolve typography by role
   * @returns Typography definition or undefined if not found
   */
  resolveFont(role: string): BrandTypography | undefined {
    return this.config.typography[role];
  }

  /**
   * Get spacing value by scale name
   * @returns Spacing in pixels or undefined if not found
   */
  resolveSpacing(scale: string): number | undefined {
    return this.config.spacing.scales[scale];
  }

  /**
   * Get asset path by name
   * @returns Resolved asset path relative to brand config directory
   */
  resolveAsset(name: string): string | undefined {
    const assetPath = this.config.assets[name];
    if (!assetPath) return undefined;
    return path.join(path.dirname(this.configPath), assetPath);
  }

  /**
   * Load style profile if it exists (not auto-loaded with brand config)
   * @returns StyleProfile or null if not found
   */
  async loadStyleProfile(): Promise<StyleProfile | null> {
    const profilePath = path.join(path.dirname(this.configPath), 'style-profile.json');
    try {
      const content = await fs.readFile(profilePath, 'utf-8');
      this.styleProfile = JSON.parse(content) as StyleProfile;
      return this.styleProfile;
    } catch {
      // Style profile is optional - return null if not found
      return null;
    }
  }

  /**
   * Get loaded style profile
   * @returns StyleProfile or null if not loaded
   */
  getStyleProfile(): StyleProfile | null {
    return this.styleProfile;
  }
}

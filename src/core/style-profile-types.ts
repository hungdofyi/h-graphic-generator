import { z } from 'zod';

/**
 * Style profile metadata - extraction info
 */
export const StyleProfileMetadataSchema = z.object({
  imageCount: z.number(),
  categories: z.array(z.string()),
  extractedAt: z.string(),
});

export type StyleProfileMetadata = z.infer<typeof StyleProfileMetadataSchema>;

/**
 * Global style patterns across all categories
 */
export const GlobalStyleProfileSchema = z.object({
  colorApplication: z.object({
    primaryUsage: z.string().min(50, 'Response too vague'),
    accentUsage: z.string().min(50, 'Response too vague'),
    backgroundPatterns: z.string().min(50, 'Response too vague'),
  }),
  typographyHierarchy: z.object({
    headingStyle: z.string().min(50, 'Response too vague'),
    bodyStyle: z.string().min(50, 'Response too vague'),
    emphasisPatterns: z.string().min(50, 'Response too vague'),
  }),
  spacingRhythm: z.string().min(50, 'Response too vague'),
  decorativeElements: z.array(z.string()),
  illustrationStyle: z.string().min(50, 'Response too vague'),
  overallMood: z.string().min(20, 'Response too vague'),
});

export type GlobalStyleProfile = z.infer<typeof GlobalStyleProfileSchema>;

/**
 * Per-category style analysis
 */
export const CategoryStyleProfileSchema = z.object({
  composition: z.string().min(50, 'Response too vague'),
  colorUsage: z.string().min(50, 'Response too vague'),
  elements: z.string().min(50, 'Response too vague'),
  layout: z.string().min(50, 'Response too vague'),
});

export type CategoryStyleProfile = z.infer<typeof CategoryStyleProfileSchema>;

/**
 * Full style profile schema
 */
export const StyleProfileSchema = z.object({
  $schema: z.literal('h-graphic-style-v1'),
  extractedFrom: StyleProfileMetadataSchema,
  global: GlobalStyleProfileSchema,
  categories: z.record(z.string(), CategoryStyleProfileSchema),
});

export type StyleProfile = z.infer<typeof StyleProfileSchema>;

/**
 * Relaxed schema for initial parsing (before quality validation)
 */
export const RelaxedCategoryStyleProfileSchema = z.object({
  composition: z.string(),
  colorUsage: z.string(),
  elements: z.string(),
  layout: z.string(),
});

export const RelaxedGlobalStyleProfileSchema = z.object({
  colorApplication: z.object({
    primaryUsage: z.string(),
    accentUsage: z.string(),
    backgroundPatterns: z.string(),
  }),
  typographyHierarchy: z.object({
    headingStyle: z.string(),
    bodyStyle: z.string(),
    emphasisPatterns: z.string(),
  }),
  spacingRhythm: z.string(),
  decorativeElements: z.array(z.string()),
  illustrationStyle: z.string(),
  overallMood: z.string(),
});

import type { Template, BrandConfig } from '../../core/types.js';
import { escapeHtml } from '../../core/sanitize.js';

/**
 * Feature Illustration Template
 * Visual representation of a product feature for landing pages and docs
 */
export const featureIllustration: Template = {
  name: 'feature-illustration',
  description: 'Feature card with icon, title, and description for landing pages',
  category: 'marketing',
  defaultSize: { width: 800, height: 600 },
  props: {
    title: {
      type: 'string',
      required: true,
      description: 'Main feature title',
    },
    description: {
      type: 'string',
      required: false,
      default: '',
      description: 'Feature description text',
    },
    icon: {
      type: 'string',
      required: false,
      default: '',
      description: 'Single letter/symbol for icon (leave empty to use first letter of title)',
    },
    accentColor: {
      type: 'string',
      required: false,
      description: 'Override accent color (hex)',
    },
  },
  render: (props: Record<string, unknown>, brand: BrandConfig): string => {
    const title = escapeHtml(String(props['title'] || ''));
    const description = props['description'] ? escapeHtml(String(props['description'])) : '';
    // Use provided icon or first letter of title (emojis don't render in Satori)
    const iconChar = props['icon'] ? escapeHtml(String(props['icon'])) : title.charAt(0).toUpperCase();
    const accentColor = String(props['accentColor'] || brand.colors['secondary']?.value || '#FF6B35');
    const primaryColor = brand.colors['primary']?.value || '#0066CC';
    const bgColor = brand.colors['background']?.value || '#FFFFFF';
    const textColor = brand.colors['text']?.value || '#1A1A2E';
    const mutedColor = brand.colors['muted']?.value || '#6B7280';

    const fontFamily = brand.typography['display']?.family || 'Inter';
    const spacing = brand.spacing.scales;

    return `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: ${spacing['2xl'] || 48}px; background-color: ${bgColor};">
        <div style="display: flex; justify-content: center; align-items: center; width: 120px; height: 120px; border-radius: 24px; background-color: ${primaryColor}; margin-bottom: ${spacing['lg'] || 24}px;">
          <div style="display: flex; font-family: ${fontFamily}; font-size: 48px; font-weight: 700; color: white;">${iconChar}</div>
        </div>
        <div style="display: flex; font-family: ${fontFamily}; font-weight: 700; font-size: 36px; color: ${textColor}; text-align: center; margin-bottom: ${spacing['md'] || 16}px;">
          ${title}
        </div>
        ${description ? `
        <div style="display: flex; font-family: ${fontFamily}; font-weight: 400; font-size: 18px; color: ${mutedColor}; text-align: center; max-width: 600px; line-height: 1.5;">
          ${description}
        </div>
        ` : ''}
        <div style="display: flex; position: absolute; bottom: ${spacing['lg'] || 24}px; left: ${spacing['lg'] || 24}px; width: 60px; height: 4px; background-color: ${primaryColor}; border-radius: 2px;"></div>
      </div>
    `;
  },
};

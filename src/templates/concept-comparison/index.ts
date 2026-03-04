import type { Template, BrandConfig } from '../../core/types.js';
import { escapeHtml } from '../../core/sanitize.js';

/**
 * Concept Comparison Template
 * Before/after or vs comparison for landing pages and docs
 */
export const conceptComparison: Template = {
  name: 'concept-comparison',
  description: 'Two-column comparison graphic (before/after, us vs them)',
  category: 'marketing',
  defaultSize: { width: 1200, height: 600 },
  props: {
    leftTitle: {
      type: 'string',
      required: true,
      description: 'Left column title',
    },
    leftItems: {
      type: 'array',
      required: true,
      description: 'Left column bullet items',
    },
    rightTitle: {
      type: 'string',
      required: true,
      description: 'Right column title',
    },
    rightItems: {
      type: 'array',
      required: true,
      description: 'Right column bullet items',
    },
    vsLabel: {
      type: 'string',
      required: false,
      default: 'vs',
      description: 'Center label between columns',
    },
  },
  render: (props: Record<string, unknown>, brand: BrandConfig): string => {
    const leftTitle = escapeHtml(String(props['leftTitle'] || ''));
    const rightTitle = escapeHtml(String(props['rightTitle'] || ''));
    const leftItems = (props['leftItems'] as string[]) || [];
    const rightItems = (props['rightItems'] as string[]) || [];
    const vsLabel = escapeHtml(String(props['vsLabel'] || 'vs'));

    const primaryColor = brand.colors['primary']?.value || '#0066CC';
    const bgColor = brand.colors['background']?.value || '#FFFFFF';
    const textColor = brand.colors['text']?.value || '#1A1A2E';
    const mutedColor = brand.colors['muted']?.value || '#6B7280';
    const fontFamily = brand.typography['body']?.family || 'Inter';
    const spacing = brand.spacing.scales;

    const renderItems = (items: string[], bulletColor: string) =>
      items
        .map(
          (item) => `
          <div style="display: flex; flex-direction: row; align-items: flex-start; margin-bottom: ${spacing['sm'] || 8}px;">
            <div style="display: flex; width: 8px; height: 8px; border-radius: 4px; background-color: ${bulletColor}; margin-top: 6px; margin-right: ${spacing['sm'] || 8}px; flex-shrink: 0;"></div>
            <div style="display: flex; font-family: ${fontFamily}; font-size: 16px; color: ${textColor}; line-height: 1.5;">
              ${escapeHtml(String(item))}
            </div>
          </div>
        `
        )
        .join('');

    return `
      <div style="display: flex; flex-direction: row; justify-content: center; align-items: stretch; width: 100%; height: 100%; padding: ${spacing['xl'] || 32}px; background-color: ${bgColor};">
        <div style="display: flex; flex-direction: column; flex: 1; padding: ${spacing['lg'] || 24}px; background-color: ${mutedColor}15; border-radius: 16px; margin-right: ${spacing['md'] || 16}px;">
          <div style="display: flex; font-family: ${fontFamily}; font-weight: 700; font-size: 24px; color: ${mutedColor}; margin-bottom: ${spacing['lg'] || 24}px;">
            ${leftTitle}
          </div>
          <div style="display: flex; flex-direction: column;">
            ${renderItems(leftItems, mutedColor)}
          </div>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; width: 80px; flex-shrink: 0;">
          <div style="display: flex; justify-content: center; align-items: center; width: 60px; height: 60px; border-radius: 30px; background-color: ${primaryColor}; color: white; font-family: ${fontFamily}; font-weight: 700; font-size: 16px;">
            ${vsLabel}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; flex: 1; padding: ${spacing['lg'] || 24}px; background-color: ${primaryColor}10; border-radius: 16px; border: 2px solid ${primaryColor}; margin-left: ${spacing['md'] || 16}px;">
          <div style="display: flex; font-family: ${fontFamily}; font-weight: 700; font-size: 24px; color: ${primaryColor}; margin-bottom: ${spacing['lg'] || 24}px;">
            ${rightTitle}
          </div>
          <div style="display: flex; flex-direction: column;">
            ${renderItems(rightItems, primaryColor)}
          </div>
        </div>
      </div>
    `;
  },
};

import type { Template, BrandConfig } from '../../core/types.js';
import { escapeHtml } from '../../core/sanitize.js';

interface Step {
  number?: number;
  title: string;
  description?: string;
  icon?: string;
}

/**
 * Process Steps Template
 * Numbered step-by-step graphic for how-to guides and onboarding flows
 */
export const processSteps: Template = {
  name: 'process-steps',
  description: 'Numbered step-by-step process graphic for guides and docs',
  category: 'docs',
  defaultSize: { width: 1200, height: 400 },
  props: {
    steps: {
      type: 'array',
      required: true,
      description: 'Array of steps with title, description, and optional icon',
    },
    title: {
      type: 'string',
      required: false,
      default: '',
      description: 'Optional heading above steps',
    },
  },
  render: (props: Record<string, unknown>, brand: BrandConfig): string => {
    const steps = (props['steps'] as Step[]) || [];
    const title = props['title'] ? escapeHtml(String(props['title'])) : '';

    const primaryColor = brand.colors['primary']?.value || '#0066CC';
    const bgColor = brand.colors['background']?.value || '#FFFFFF';
    const textColor = brand.colors['text']?.value || '#1A1A2E';
    const mutedColor = brand.colors['muted']?.value || '#6B7280';
    const fontFamily = brand.typography['body']?.family || 'Inter';
    const spacing = brand.spacing.scales;

    const stepWidth = Math.min(280, Math.floor(1100 / Math.max(steps.length, 1)));

    const stepsHtml = steps
      .map((step, index) => {
        const stepTitle = escapeHtml(String(step.title || ''));
        const stepDesc = step.description ? escapeHtml(String(step.description)) : '';
        const stepIcon = step.icon ? escapeHtml(String(step.icon)) : '';
        const stepNum = step.number ?? index + 1;

        return `
          <div style="display: flex; flex-direction: column; align-items: center; width: ${stepWidth}px; padding: ${spacing['sm'] || 8}px;">
            <div style="display: flex; justify-content: center; align-items: center; width: 48px; height: 48px; border-radius: 24px; background-color: ${primaryColor}; color: white; font-family: ${fontFamily}; font-weight: 700; font-size: 20px; margin-bottom: ${spacing['sm'] || 8}px;">
              ${stepIcon || stepNum}
            </div>
            <div style="display: flex; font-family: ${fontFamily}; font-weight: 600; font-size: 16px; color: ${textColor}; text-align: center; margin-bottom: ${spacing['xs'] || 4}px;">
              ${stepTitle}
            </div>
            ${stepDesc ? `
            <div style="display: flex; font-family: ${fontFamily}; font-weight: 400; font-size: 13px; color: ${mutedColor}; text-align: center; line-height: 1.4;">
              ${stepDesc}
            </div>
            ` : ''}
          </div>
          ${index < steps.length - 1 ? `
          <div style="display: flex; align-items: center; justify-content: center; width: 40px; margin-top: 24px;">
            <div style="display: flex; width: 30px; height: 2px; background-color: ${mutedColor};"></div>
            <div style="display: flex; width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 8px solid ${mutedColor};"></div>
          </div>
          ` : ''}
        `;
      })
      .join('');

    return `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: ${spacing['xl'] || 32}px; background-color: ${bgColor};">
        ${title ? `
        <div style="display: flex; font-family: ${fontFamily}; font-weight: 700; font-size: 24px; color: ${textColor}; margin-bottom: ${spacing['lg'] || 24}px;">
          ${title}
        </div>
        ` : ''}
        <div style="display: flex; flex-direction: row; justify-content: center; align-items: flex-start;">
          ${stepsHtml}
        </div>
      </div>
    `;
  },
};

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const CreateGraphicSchema = z.object({
  step: z
    .enum(['start', 'type_selected', 'requirements_gathered', 'ready_to_render'])
    .default('start')
    .describe('Current step in the workflow'),
  type: z
    .enum(['diagram', 'annotation', 'marketing'])
    .optional()
    .describe('Type of graphic (set after step 1)'),
  // Diagram fields
  nodes: z.string().optional().describe('Nodes/elements for diagram'),
  connections: z.string().optional().describe('How nodes connect (e.g., "A → B → C")'),
  direction: z.enum(['left-to-right', 'top-to-bottom']).optional().describe('Flow direction'),
  // Annotation fields
  screenshotPath: z.string().optional().describe('Path to screenshot image'),
  highlights: z.string().optional().describe('Elements to highlight'),
  annotations: z.string().optional().describe('Text annotations to add'),
  // Marketing fields
  headline: z.string().optional().describe('Main headline'),
  visualFocus: z.enum(['icon', 'dashboard', 'code', 'illustration']).optional(),
  background: z.enum(['dark-navy', 'green-gradient', 'light', 'mesh']).optional(),
  // Output fields
  width: z.number().optional().default(1200),
  height: z.number().optional().default(630),
  outputPath: z.string().optional().describe('Output file path'),
  format: z.enum(['png', 'svg', 'jpg', 'webp']).optional().default('png'),
});

/**
 * Register the create_graphic tool - guides step-by-step input
 * Call multiple times to progress through the workflow
 */
export function registerCreateGraphicTool(server: McpServer): void {
  server.tool(
    'create_graphic',
    `Guide the user through graphic creation step-by-step. Call this tool multiple times to progress through the workflow.

WORKFLOW:
1. Call with step="start" → Returns question about graphic type
2. Call with step="type_selected" + type → Returns type-specific questions
3. Call with step="requirements_gathered" + all fields → Returns output settings questions
4. Call with step="ready_to_render" + all fields → Returns final requirements for render_graphic

ASK ONE QUESTION AT A TIME. Wait for user response before calling again with next step.`,
    CreateGraphicSchema.shape,
    async (args) => {
      const input = CreateGraphicSchema.parse(args);

      // Step 1: Ask for graphic type
      if (input.step === 'start') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                step: 'ask_type',
                question: 'What type of graphic do you want to create?',
                options: [
                  { value: 'diagram', label: 'Diagram', description: 'Technical flows, architecture, data pipelines' },
                  { value: 'annotation', label: 'Annotation', description: 'Screenshot highlights, feature documentation' },
                  { value: 'marketing', label: 'Marketing', description: 'Feature showcases, promotional graphics' },
                ],
                instruction: 'Ask the user to choose one of these types. Then call create_graphic again with step="type_selected" and the chosen type.',
              }),
            },
          ],
        };
      }

      // Step 2: Ask type-specific questions
      if (input.step === 'type_selected') {
        if (!input.type) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: 'type is required for step type_selected' }) }],
            isError: true,
          };
        }

        const questions = {
          diagram: [
            { field: 'nodes', question: 'What nodes or elements should be shown?', example: 'Users, Orders, Products' },
            { field: 'connections', question: 'How do they connect?', example: 'Users → Orders → Products' },
            { field: 'direction', question: 'Flow direction?', options: ['left-to-right', 'top-to-bottom'] },
          ],
          annotation: [
            { field: 'screenshotPath', question: 'Do you have a screenshot image? If so, what is the path?', optional: true },
            { field: 'highlights', question: 'What elements should be highlighted?' },
            { field: 'annotations', question: 'What text annotations or callouts should be added?' },
          ],
          marketing: [
            { field: 'headline', question: 'What is the main headline or feature name?' },
            { field: 'visualFocus', question: 'What should be the visual focus?', options: ['icon', 'dashboard', 'code', 'illustration'] },
            { field: 'background', question: 'Background style preference?', options: ['dark-navy', 'green-gradient', 'light', 'mesh'] },
          ],
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                step: 'ask_requirements',
                type: input.type,
                questions: questions[input.type],
                instruction: 'Ask these questions ONE AT A TIME. After gathering all answers, call create_graphic with step="requirements_gathered" and all the collected values.',
              }),
            },
          ],
        };
      }

      // Step 3: Ask for output settings
      if (input.step === 'requirements_gathered') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                step: 'ask_output',
                collectedRequirements: {
                  type: input.type,
                  nodes: input.nodes,
                  connections: input.connections,
                  direction: input.direction,
                  screenshotPath: input.screenshotPath,
                  highlights: input.highlights,
                  annotations: input.annotations,
                  headline: input.headline,
                  visualFocus: input.visualFocus,
                  background: input.background,
                },
                questions: [
                  { field: 'width', question: 'Output width in pixels?', default: 1200 },
                  { field: 'height', question: 'Output height in pixels?', default: 630 },
                  { field: 'outputPath', question: 'Where should the image be saved?', example: 'output/my-graphic.png' },
                  { field: 'format', question: 'Output format?', options: ['png', 'svg', 'jpg', 'webp'], default: 'png' },
                ],
                instruction: 'Ask about output settings. Many users provide these upfront - use those values. Then call create_graphic with step="ready_to_render" and ALL collected values.',
              }),
            },
          ],
        };
      }

      // Step 4: Return final requirements for rendering
      if (input.step === 'ready_to_render') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                message: 'Requirements complete. Now generate HTML/CSS and call render_graphic.',
                graphicType: input.type,
                requirements: {
                  // Diagram
                  nodes: input.nodes,
                  connections: input.connections,
                  direction: input.direction || 'left-to-right',
                  // Annotation
                  screenshotPath: input.screenshotPath,
                  highlights: input.highlights,
                  annotations: input.annotations,
                  // Marketing
                  headline: input.headline,
                  visualFocus: input.visualFocus,
                  background: input.background || 'dark-navy',
                },
                output: {
                  width: input.width || 1200,
                  height: input.height || 630,
                  path: input.outputPath,
                  format: input.format || 'png',
                },
                nextStep: 'Generate HTML/CSS based on these requirements following brand guidelines, then call render_graphic.',
              }),
            },
          ],
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Unknown step' }) }],
        isError: true,
      };
    }
  );
}

import type { Command } from 'commander';
import pc from 'picocolors';
import { registry } from '../../templates/registry.js';
import type { TemplateCategory } from '../../core/types.js';

interface ListOptions {
  category?: string;
  json?: boolean;
}

export function registerTemplatesCommand(program: Command): void {
  const templates = program.command('templates').description('Template management');

  templates
    .command('list')
    .description('List available templates')
    .option('-c, --category <cat>', 'Filter by category (illustration|diagram|social|presentation)')
    .option('--json', 'JSON output')
    .action((options: ListOptions) => {
      const allTemplates = registry.list(options.category as TemplateCategory | undefined);

      if (options.json) {
        const templateInfo = allTemplates.map((t) => ({
          name: t.name,
          description: t.description,
          category: t.category,
          defaultSize: t.defaultSize,
          requiredProps: Object.entries(t.props || {})
            .filter(([, v]) => v.required)
            .map(([k]) => k),
        }));
        console.log(JSON.stringify({ count: templateInfo.length, templates: templateInfo }));
      } else {
        console.log(pc.bold(`\nAvailable Templates (${allTemplates.length}):\n`));
        for (const t of allTemplates) {
          console.log(pc.cyan(`  ${t.name}`));
          console.log(`    ${t.description}`);
          console.log(`    Category: ${t.category} | Size: ${t.defaultSize.width}x${t.defaultSize.height}`);
          const required = Object.entries(t.props || {})
            .filter(([, v]) => v.required)
            .map(([k]) => k);
          if (required.length > 0) {
            console.log(`    Required: ${required.join(', ')}`);
          }
          console.log('');
        }
      }
    });
}

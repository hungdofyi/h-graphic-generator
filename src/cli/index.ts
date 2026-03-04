import { Command } from 'commander';
import { registerRenderCommand } from './commands/render.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerDiagramCommand } from './commands/diagram.js';
import { registerBrandCommand } from './commands/brand.js';
import { registerTemplatesCommand } from './commands/templates.js';

const program = new Command();

program
  .name('hgraphic')
  .description('Branded graphic and diagram generator')
  .version('0.1.0');

// Primary command - render HTML/CSS to image
registerRenderCommand(program);

// Template-based generation
registerGenerateCommand(program);
registerDiagramCommand(program);

// Brand management
registerBrandCommand(program);
registerTemplatesCommand(program);

program.parse();

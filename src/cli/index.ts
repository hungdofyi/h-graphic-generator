import { Command } from 'commander';
import { registerRenderCommand } from './commands/render.js';
import { registerDiagramCommand } from './commands/diagram.js';
import { registerBrandCommand } from './commands/brand.js';

const program = new Command();

program
  .name('hgraphic')
  .description('Branded graphic and diagram generator')
  .version('0.1.0');

// Primary command - render HTML/CSS to image
registerRenderCommand(program);

// Diagram generation from JSON
registerDiagramCommand(program);

// Brand management
registerBrandCommand(program);

program.parse();

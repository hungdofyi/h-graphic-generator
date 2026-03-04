import type { Command } from 'commander';
import pc from 'picocolors';
import { BrandContext } from '../../core/brand-context.js';
import { StyleExtractor } from '../../core/style-extractor.js';

export function registerBrandCommand(program: Command): void {
  const brand = program.command('brand').description('Brand configuration management');

  brand
    .command('validate')
    .description('Validate brand configuration file')
    .option('-c, --config <path>', 'Brand config path', 'brand/brand.json')
    .option('--json', 'JSON output')
    .action(async (options) => {
      try {
        const ctx = await BrandContext.load(options.config);
        const config = ctx.getConfig();

        if (options.json) {
          console.log(
            JSON.stringify({
              valid: true,
              name: config.name,
              colorsCount: Object.keys(config.colors).length,
              typographyRoles: Object.keys(config.typography),
            })
          );
        } else {
          console.log(pc.green('✓') + ' Brand config is valid');
          console.log(`  Name: ${config.name}`);
          console.log(`  Colors: ${Object.keys(config.colors).length}`);
          console.log(`  Typography: ${Object.keys(config.typography).join(', ')}`);
        }
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ valid: false, error: (error as Error).message }));
        } else {
          console.error(pc.red('✗') + ' Invalid brand config');
          console.error(`  ${(error as Error).message}`);
        }
        process.exit(1);
      }
    });

  brand
    .command('extract-style')
    .description('Extract style profile from reference images using Gemini AI')
    .option('--references <dir>', 'Reference images directory', 'brand/references')
    .option('--output <dir>', 'Output directory', 'brand')
    .option('--model <name>', 'Gemini model to use', 'gemini-2.0-flash')
    .action(async (options) => {
      try {
        console.log(pc.bold('\n🎨 Extracting style profile...\n'));

        const extractor = new StyleExtractor();
        await extractor.extract({
          referencesDir: options.references,
          outputDir: options.output,
          model: options.model,
          onProgress: (msg) => console.log(msg),
        });

        console.log(pc.green('\n✓ Style profile extracted successfully!'));
      } catch (error) {
        console.error(pc.red('\n✗ Failed to extract style profile'));
        console.error(`  ${(error as Error).message}`);
        process.exit(1);
      }
    });
}

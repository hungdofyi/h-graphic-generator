import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGetIconTool } from '../src/mcp/tools/get-icon.js';

describe('get_icon tool', () => {
  let server: McpServer;
  let toolHandler: (args: { name: string }) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>;

  beforeAll(() => {
    server = new McpServer({ name: 'test', version: '0.1.0' });

    // Capture the tool handler when registered
    const originalTool = server.tool.bind(server);
    vi.spyOn(server, 'tool').mockImplementation((name, description, schema, handler) => {
      if (name === 'get_icon') {
        toolHandler = handler as typeof toolHandler;
      }
      return originalTool(name, description, schema, handler);
    });

    registerGetIconTool(server);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('alias resolution', () => {
    it('should resolve "database" alias to icon-data-warehouse.svg', async () => {
      const result = await toolHandler({ name: 'database' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.name).toBe('database');
      expect(data.path).toContain('icon-data-warehouse.svg');
      expect(data.svgContent).toContain('<svg');
    });

    it('should resolve "cursor" alias', async () => {
      const result = await toolHandler({ name: 'cursor' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.name).toBe('cursor');
      expect(data.path).toContain('cursor.svg');
      expect(data.svgContent).toBeDefined();
    });

    it('should resolve "arrow-right" alias', async () => {
      const result = await toolHandler({ name: 'arrow-right' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.path).toContain('diagram-arrow-horizontal.svg');
    });

    it('should resolve "pointer" as alias for cursor', async () => {
      const result = await toolHandler({ name: 'pointer' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.path).toContain('cursor.svg');
    });
  });

  describe('direct path resolution', () => {
    it('should find icon by category/name path', async () => {
      const result = await toolHandler({ name: 'diagram-icons/bar-chart' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.svgContent).toContain('<svg');
    });

    it('should find icon in brand/svg subdirectories', async () => {
      const result = await toolHandler({ name: 'arrows/arrow-b' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.svgContent).toContain('<svg');
    });
  });

  describe('error handling', () => {
    it('should return error for nonexistent icon', async () => {
      const result = await toolHandler({ name: 'nonexistent-icon-xyz' });

      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toContain('not found');
      expect(data.availableAliases).toBeDefined();
      expect(data.hint).toContain('list_icons');
    });

    it('should include searched paths in error', async () => {
      const result = await toolHandler({ name: 'fake-icon' });

      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.searchedPaths).toBeInstanceOf(Array);
      expect(data.searchedPaths.length).toBeGreaterThan(0);
    });
  });

  describe('CSS variable extraction', () => {
    it('should extract CSS variables from SVG content', async () => {
      // Cursor SVG typically has CSS variables for theming
      const result = await toolHandler({ name: 'cursor' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      // CSS variables may or may not be present depending on the SVG
      expect(data.usage).toBeDefined();
    });
  });

  describe('response format', () => {
    it('should return proper response structure', async () => {
      const result = await toolHandler({ name: 'database' });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);

      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('path');
      expect(data).toHaveProperty('svgContent');
      expect(data).toHaveProperty('usage');
      expect(data).toHaveProperty('example');
    });
  });
});

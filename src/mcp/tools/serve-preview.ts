import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import http from 'node:http';

// Track active preview servers for cleanup
const activeServers = new Map<number, http.Server>();

const ServePreviewSchema = z.object({
  html: z.string().describe('HTML/CSS code to serve. Should be a complete HTML document or fragment.'),
  port: z.number().min(1024).max(65535).default(3456).describe('Port to serve on (default: 3456, range: 1024-65535)'),
  width: z.number().optional().describe('Optional viewport width hint for the HTML wrapper'),
  height: z.number().optional().describe('Optional viewport height hint for the HTML wrapper'),
});

const StopPreviewSchema = z.object({
  port: z.number().min(1024).max(65535).default(3456).describe('Port of the preview server to stop (default: 3456)'),
});

/**
 * Wrap HTML fragment in a complete document if needed
 */
function wrapHtml(html: string, width?: number, height?: number): string {
  // If already a complete document, return as-is
  if (html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html')) {
    return html;
  }

  // Wrap fragment in a minimal document with viewport sizing
  const viewportStyle = width && height
    ? `width: ${width}px; height: ${height}px; margin: 0 auto;`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      ${viewportStyle}
    }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Register serve_preview tool - serves HTML via local HTTP server
 * for Figma MCP capture
 */
export function registerServePreviewTool(server: McpServer): void {
  server.tool(
    'serve_preview',
    'Start a local HTTP server to preview HTML. Returns URL for Figma MCP generate_figma_design to capture. Call stop_preview when done.',
    ServePreviewSchema.shape,
    async (args) => {
      const input = ServePreviewSchema.parse(args);

      // Stop existing server on same port if running
      if (activeServers.has(input.port)) {
        const existing = activeServers.get(input.port);
        existing?.close();
        activeServers.delete(input.port);
      }

      const wrappedHtml = wrapHtml(input.html, input.width, input.height);

      return new Promise((resolve) => {
        const httpServer = http.createServer((req, res) => {
          // CORS headers for all responses (needed for Figma capture)
          const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          };

          // Handle CORS preflight
          if (req.method === 'OPTIONS') {
            res.writeHead(204, corsHeaders);
            res.end();
            return;
          }

          // Serve HTML at root
          if (req.url === '/' || req.url === '/index.html') {
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Length': Buffer.byteLength(wrappedHtml),
              ...corsHeaders,
            });
            res.end(wrappedHtml);
          } else {
            res.writeHead(404, corsHeaders);
            res.end('Not Found');
          }
        });

        // Set request timeout to prevent slow loris attacks (30 seconds)
        httpServer.setTimeout(30000);

        httpServer.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            resolve({
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: `Port ${input.port} is already in use. Try a different port or call stop_preview first.`,
                }),
              }],
              isError: true,
            });
          } else {
            resolve({
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: err.message,
                }),
              }],
              isError: true,
            });
          }
        });

        httpServer.listen(input.port, '127.0.0.1', () => {
          activeServers.set(input.port, httpServer);

          resolve({
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                url: `http://localhost:${input.port}`,
                port: input.port,
                message: 'Preview server started. Use this URL with Figma MCP generate_figma_design to capture. Call stop_preview when done.',
              }),
            }],
          });
        });
      });
    }
  );
}

/**
 * Register stop_preview tool - stops running preview server
 */
export function registerStopPreviewTool(server: McpServer): void {
  server.tool(
    'stop_preview',
    'Stop a running preview server started by serve_preview.',
    StopPreviewSchema.shape,
    async (args) => {
      const input = StopPreviewSchema.parse(args);

      const httpServer = activeServers.get(input.port);
      if (!httpServer) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: `No preview server running on port ${input.port}`,
            }),
          }],
          isError: true,
        };
      }

      return new Promise((resolve) => {
        httpServer.close((err) => {
          activeServers.delete(input.port);

          if (err) {
            resolve({
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: err.message,
                }),
              }],
              isError: true,
            });
          } else {
            resolve({
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  message: `Preview server on port ${input.port} stopped.`,
                }),
              }],
            });
          }
        });
      });
    }
  );
}

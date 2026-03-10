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
 * Figma MCP capture script - required for generate_figma_design to work
 * This is the official script from Figma that enables HTML-to-Figma capture
 */
const FIGMA_CAPTURE_SCRIPT = `<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>`;

/**
 * Additional script that ensures fonts/images are loaded before capture
 * This prevents race conditions where Figma captures before fonts render
 */
const CAPTURE_READY_SCRIPT = `
${FIGMA_CAPTURE_SCRIPT}
<script>
(function() {
  // Wait for fonts to load, then signal ready
  Promise.all([
    document.fonts.ready,
    // Also wait for any images
    new Promise(function(resolve) {
      var images = document.images;
      if (images.length === 0) return resolve();
      var loaded = 0;
      for (var i = 0; i < images.length; i++) {
        if (images[i].complete) {
          loaded++;
          if (loaded === images.length) resolve();
        } else {
          images[i].onload = images[i].onerror = function() {
            loaded++;
            if (loaded === images.length) resolve();
          };
        }
      }
    })
  ]).then(function() {
    // Add marker element for capture tools
    var marker = document.createElement('div');
    marker.id = 'capture-ready';
    marker.setAttribute('data-ready', 'true');
    marker.style.display = 'none';
    document.body.appendChild(marker);
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('capture-ready'));
  });
})();
</script>
`;

/**
 * Wrap HTML fragment in a complete document if needed
 * Always injects capture-ready script for reliable Figma capture
 */
function wrapHtml(html: string, width?: number, height?: number): string {
  // If already a complete document, inject capture script before </body>
  if (html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html')) {
    // Inject capture script before closing body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${CAPTURE_READY_SCRIPT}</body>`);
    }
    // Or before closing html tag
    if (html.includes('</html>')) {
      return html.replace('</html>', `${CAPTURE_READY_SCRIPT}</html>`);
    }
    // Append at end if no closing tags found
    return html + CAPTURE_READY_SCRIPT;
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
${CAPTURE_READY_SCRIPT}
</body>
</html>`;
}

/**
 * Register serve_preview tool - serves HTML via local HTTP server
 * for Figma MCP capture. Auto-injects Figma capture.js script.
 */
export function registerServePreviewTool(server: McpServer): void {
  server.tool(
    'serve_preview',
    'Start a local HTTP server to preview HTML. Auto-injects Figma capture script (capture.js) - no need to add it manually. Returns captureUrl ready for Figma MCP generate_figma_design. Call stop_preview when done.',
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

          const baseUrl = `http://localhost:${input.port}`;
          resolve({
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                url: baseUrl,
                captureUrl: `${baseUrl}#figmacapture&figmadelay=1000`,
                port: input.port,
                message: 'Preview server started. Figma capture script (capture.js) is already included. Use captureUrl with Figma MCP generate_figma_design or open directly in browser. Call stop_preview when done.',
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

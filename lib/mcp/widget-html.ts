import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MapAble</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2 style="margin:0 0 8px;font-size:1rem;">MapAble</h2>
      <p id="summary" style="margin:0 0 12px;color:#4b5563;">Open MapAble to review and confirm.</p>
      <a id="cta" href="#" target="_blank" rel="noopener">Continue in MapAble</a>
    </div>
    <script>
      (function () {
        var state = window.openai && window.openai.widgetState;
        if (state && state.summary) {
          document.getElementById("summary").textContent = state.summary;
        }
        if (state && state.primaryUrl) {
          document.getElementById("cta").href = state.primaryUrl;
        }
      })();
    </script>
  </body>
</html>`;

let cached: string | null = null;

export function readWidgetHtml(): string {
  if (cached) return cached;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const built = join(here, "../../apps/chatgpt-mcp/widget/dist/index.html");
    cached = readFileSync(built, "utf8");
    return cached;
  } catch {
    cached = FALLBACK_HTML;
    return cached;
  }
}

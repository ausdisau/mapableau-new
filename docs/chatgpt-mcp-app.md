# ChatGPT App (Apps SDK + MCP)

MapAble exposes a **standalone HTTP MCP server** for ChatGPT Apps. ChatGPT connects to `https://<host>/mcp` using MCP **Streamable HTTP** — not stdio.

## Architecture

| Component | Path | Role |
| --------- | ---- | ---- |
| HTTP MCP server | `apps/chatgpt-mcp` | Express + `StreamableHTTPServerTransport` on `/mcp` |
| Tool handlers | `lib/mcp/*` | Co-Pilot, worker search, needs assessment, shift planner |
| Cursor MCP (stdio) | `mcp/av/server.ts` | Unchanged — for local Cursor only |
| MapAble web UI | Next.js | Users confirm drafts (no writes via MCP v1) |

## v1 governance

- **Draft/plan only** — no assign-worker, PRMS confirm, or booking creation from ChatGPT.
- Tool descriptions state: confirm actions in MapAble.
- Bearer token required outside local dev (optional locally).

## Tools

| Tool | Description |
| ---- | ----------- |
| `mapable_get_capabilities` | Feature catalog, deep links, governance |
| `mapable_copilot_plan` | Intent → context → actions (guardrailed) |
| `mapable_search_workers` | Worker matching (aggregated stream result) |
| `mapable_assess_needs` | Participant needs assessment |
| `mapable_plan_care_shift` | Shift draft (provider demo actor) |

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Same Postgres as the Next.js app |
| `CHATGPT_MCP_PORT` | Default `8787` |
| `CHATGPT_MCP_BIND_HOST` | Default `127.0.0.1` (use `0.0.0.0` behind a proxy) |
| `CHATGPT_MCP_BEARER_TOKEN` | Required in non-local environments |
| `MAPABLE_PUBLIC_URL` | Base URL for deep links |
| `MAPABLE_MCP_DEMO_PARTICIPANT_ID` | Default `participant-demo-001` |
| `MAPABLE_MCP_DEMO_PROVIDER_USER_ID` | Optional; else first `provider_admin` org member |

## Local development

1. Copy env from the main app (`.env` with `DATABASE_URL`, etc.).
2. Set `CHATGPT_MCP_BEARER_TOKEN` (any secret for ChatGPT connector).
3. Start the server:

   ```bash
   pnpm mcp:chatgpt
   ```

4. Expose HTTPS (ChatGPT requires a public URL):

   ```bash
   ngrok http 8787
   ```

5. In ChatGPT: **Settings → Apps & Connectors → Developer mode** → add connector:
   - URL: `https://<your-ngrok-host>/mcp`
   - Auth: Bearer token matching `CHATGPT_MCP_BEARER_TOKEN`

6. Health check: `GET http://127.0.0.1:8787/health`

## Scripts

| Script | Command |
| ------ | ------- |
| `pnpm mcp:chatgpt` | Run MCP HTTP server |
| `pnpm mcp:chatgpt:dev` | Watch mode |

## Optional UI widget

Resource URI: `ui://mapable/result-card`

Built HTML lives at `apps/chatgpt-mcp/widget/dist/index.html`. Tools attach `openai/outputTemplate` metadata so ChatGPT can render a summary card with a link back to MapAble.

## Production deploy

Deploy like `apps/realtime-server`: long-running Node service (Render, Fly, Railway, etc.).

- Health: `GET /health`
- MCP: `POST/GET /mcp` with bearer auth
- Set `CHATGPT_MCP_BIND_HOST=0.0.0.0`

App Directory submission and OAuth for ChatGPT connectors are **out of scope for v1**.

## References

- [Apps SDK quickstart](https://developers.openai.com/apps-sdk/quickstart)
- [Build with the Apps SDK (Help)](https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk)

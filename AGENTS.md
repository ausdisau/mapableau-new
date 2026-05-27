# Agent instructions

## Cursor Cloud specific instructions

Cloud agents bootstrap dependencies automatically via [`.cursor/environment.json`](.cursor/environment.json). Before running tests or type-checking, assume `node_modules` and the Prisma client are already available.

If tooling is missing in a session (for example `vitest: not found` or Prisma client errors), run:

```bash
bash .cursor/scripts/install-deps.sh
```

That script runs `pnpm install` for the full workspace (root + `apps/realtime-server`) and `pnpm exec prisma generate`. It sets `HUSKY=0` so git hook setup is skipped in ephemeral VMs.

Common commands after bootstrap:

- `pnpm test`
- `pnpm type-check`
- `pnpm dev`

## Participant needs assessment

- Live streaming assessment: `/participant-needs-assess?participantId=participant-demo-001`
- API: `POST /api/prms/participants/{id}/needs/assess/stream` (SSE progress + result)
- Co-Pilot intent `needs_assessment` links to the assessment page via `assessmentUrl` in `/api/mapable/ask` responses
- Worker search accepts `participantId` on `POST /api/search/workers/stream` to merge needs-derived filters

Do not commit `.env` or secrets. Use Cursor Cloud **Secrets** for `DATABASE_URL` and other credentials when tests need a database.

## ChatGPT App MCP (HTTP)

- **ChatGPT / Apps SDK:** `pnpm mcp:chatgpt` → Streamable HTTP at `http://127.0.0.1:8787/mcp` (see [`docs/chatgpt-mcp-app.md`](docs/chatgpt-mcp-app.md))
- **Cursor (stdio):** `pnpm mcp:av` — separate server in [`mcp/av/server.ts`](mcp/av/server.ts); do not conflate with ChatGPT connector
- Tool handlers live in [`lib/mcp/`](lib/mcp/); v1 is **draft/plan only** (no writes via MCP)
- Expose HTTPS with ngrok for ChatGPT Developer Mode; set `CHATGPT_MCP_BEARER_TOKEN` on the connector

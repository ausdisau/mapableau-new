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

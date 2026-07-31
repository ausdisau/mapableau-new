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

Do not commit `.env` or secrets. Use Cursor Cloud **Secrets** for `DATABASE_URL` and other credentials when tests need a database.

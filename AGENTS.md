# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MapAble (MapableAU) is a single Next.js 15.5 application (not a monorepo) for Australian NDIS disability support services. It uses PostgreSQL via Prisma ORM, NextAuth for authentication, and pnpm as the package manager.

### Prerequisites

- **Node.js 22+** and **pnpm 10.12+** (already in the VM via nvm)
- **PostgreSQL 16** must be running locally. Start with `sudo pg_ctlcluster 16 main start` if not running.
- Database: `mapable` owned by user `mapable` (password `mapable`) on `localhost:5432`

### Environment setup

- Copy `.env.example` to `.env` and set `DATABASE_URL` and `DIRECT_URL` to `postgresql://mapable:mapable@localhost:5432/mapable`
- All external integrations (Stripe, Xero, SendGrid, NDIA) are feature-flagged OFF by default; the app runs fully without them.

### Common commands

See `package.json` scripts. Key ones:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` (Turbopack, port 3000) |
| Lint | `pnpm lint` |
| Type-check | `pnpm type-check` |
| Tests | `pnpm test` |
| Format | `pnpm format:check` |
| DB schema push | `npx prisma db push` |
| DB seed | `npx prisma db seed` |
| Prisma generate | `npx prisma generate` |

### Seeded test accounts

All seeded users share password `Test123!`:

| Email | Role |
|-------|------|
| `admin@mapable.test` | mapable_admin |
| `participant@mapable.test` | participant |
| `coordinator@mapable.test` | support_coordinator |
| `worker@mapable.test` | support_worker |

### Non-obvious gotchas

- `pnpm install` runs `husky install && prisma generate` as a `prepare` script, so Prisma Client is always regenerated on install.
- The app entry point is `http://localhost:3000/core` (the hub page). The root `/` also works but `/core` is the main landing.
- ESLint has ~250 pre-existing import-order errors in the codebase. These are not blockers for development.
- One test (`mapable-core-hub.test.ts`) has a pre-existing failure related to `/provider-finder` path. This is a known issue in the repo.
- PostgreSQL must be started manually in Cloud Agent VMs: `sudo pg_ctlcluster 16 main start`.

# MapAble

Disability support platform — care, transport, bookings, billing, and participant-facing services. Built with Next.js (App Router), TypeScript, PostgreSQL, and Prisma.

## Getting started

### Prerequisites

- Node.js 18+
- pnpm 10.12.1+
- PostgreSQL (local or [Neon](docs/operations/neon.md))

### Install and run

```bash
pnpm install
cp .env.example .env   # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Platform hub: [http://localhost:3000/core](http://localhost:3000/core).

Seed users (see [core phases — Phase 1](docs/mapable/core-phases.md#phase-1)): `participant@mapable.test`, `admin@mapable.test`.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm type-check` | TypeScript |
| `pnpm test` | Vitest |
| `pnpm check:integrations-env` | Validate optional integration env vars |

### Database

The data model lives in a single schema: `prisma/schema.prisma`. Apply changes with `npx prisma migrate deploy` (or `npx prisma db push` in local dev).

## Project layout

```
app/           Next.js routes (dashboard, provider, admin, care, …)
components/    Shared UI
lib/           Domain logic, auth, integrations
prisma/        Schema, migrations, seeds
docs/          Detailed module and platform documentation
core/          Core hub code (`app/core/`, `components/core/`, `lib/core-ui/`)
```

## Documentation

Detailed guides live under `docs/`. This file is the only project README at the repository root.

### Platform

| Doc | Description |
| --- | --- |
| [docs/mapable/core.md](docs/mapable/core.md) | `/core` hub and integrations |
| [docs/mapable/ui.md](docs/mapable/ui.md) | Core UI shell |
| [docs/mapable/core-phases.md](docs/mapable/core-phases.md) | Phases 1–12 — routes, models, deploy |
| [docs/mapable/cursor-prompts-phases-6-10.md](docs/mapable/cursor-prompts-phases-6-10.md) | Cursor prompt packs (phases 6–10) |

### Modules

| Doc | Description |
| --- | --- |
| [docs/bookings.md](docs/bookings.md) | Bookings foundation |
| [docs/care.md](docs/care.md) | Care MVP |
| [docs/case-management.md](docs/case-management.md) | Case management (AI-assisted) |
| [docs/calendar.md](docs/calendar.md) | Unified calendar |
| [docs/consent.md](docs/consent.md) | Consent model |
| [docs/cross-module-orchestration.md](docs/cross-module-orchestration.md) | Cross-module flows |
| [docs/incidents.md](docs/incidents.md) | Incident reporting |
| [docs/jobs.md](docs/jobs.md) | Inclusive jobs |
| [docs/privacy-and-audit.md](docs/privacy-and-audit.md) | Privacy and audit |
| [docs/provider-capacity.md](docs/provider-capacity.md) | Provider capacity |
| [docs/transport.md](docs/transport.md) | Transport module |
| [docs/transport-scheduling.md](docs/transport-scheduling.md) | Transport scheduling |
| [docs/accessibility.md](docs/accessibility.md) | Accessibility profiles |
| [docs/admin-dashboard.md](docs/admin-dashboard.md) | Admin dashboard |

Phase 2 and Phase 4 capabilities (messaging, documents, matching, timesheets, Stripe/Xero placeholders, etc.) are documented in [core phases](docs/mapable/core-phases.md#phase-2) and [phase 4](docs/mapable/core-phases.md#phase-4).

### Operations and integrations

| Doc | Description |
| --- | --- |
| [docs/operations/neon.md](docs/operations/neon.md) | Neon Postgres |
| [docs/billing.md](docs/billing.md) | Billing |
| [docs/integrations/environment.md](docs/integrations/environment.md) | Integration environment variables |
| [docs/safety.md](docs/safety.md) | Safety and incident centre |
| [docs/av-mcp.md](docs/av-mcp.md) | AV / MCP transport |
| [docs/ndia-provider-claiming.md](docs/ndia-provider-claiming.md) | NDIA provider claiming |
| [docs/ROUTING_SLUGS.md](docs/ROUTING_SLUGS.md) | Route slugs |

### QA and mobile

| Doc | Description |
| --- | --- |
| [docs/qa/phase-3.md](docs/qa/phase-3.md) | Phase 3 QA checklist |
| [mobile-contracts/MOBILE_APP_ARCHITECTURE.md](mobile-contracts/MOBILE_APP_ARCHITECTURE.md) | Mobile architecture |
| [mobile-contracts/MOBILE_SCREEN_MAP.md](mobile-contracts/MOBILE_SCREEN_MAP.md) | Mobile screen map |

## Code quality

ESLint, Prettier, Husky, and lint-staged run on commit. See `package.json` scripts.

## Data imports (Access)

Legacy place data for admin import lives under `data/imports/` (often gitignored when large). Copy `MapAble.kml` or `accessible_locations_merged.geojson` from operations storage, or use **Admin → Access → Import**. GeoJSON expects a FeatureCollection with Point features and properties such as `name`, `category`, or `address`.

## License

ISC

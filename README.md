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

### Cursor cloud agent setup

Before running build, type-check, lint or tests in a fresh cloud agent, install
dependencies from the lockfile and generate Prisma Client:

```bash
pnpm setup:cloud-agent
```

This runs `pnpm install --frozen-lockfile` followed by `prisma generate`.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm type-check` | TypeScript |
| `pnpm test` | Vitest |
| `pnpm setup:cloud-agent` | Install locked dependencies and generate Prisma Client for cloud agents |
| `pnpm check:integrations-env` | Validate optional integration env vars |
| `pnpm backfill:ndis-claim-snapshots` | Idempotent NDIS claim snapshot backfill (supports `--dry-run`) |

### Database

The data model lives in a single schema: `prisma/schema.prisma`. Apply changes with `npx prisma migrate deploy` (or `npx prisma db push` in local dev).

## Project layout

```
.
├── app/                      # Next.js App Router
│   ├── api/                  # Route handlers (REST, webhooks, transport, care, …)
│   ├── admin/                # Admin console (bookings, care, transport, governance, …)
│   ├── dashboard/            # Participant dashboard (bookings, care, cases, safety, …)
│   ├── provider/             # Provider portal
│   ├── care/                 # Care module pages
│   ├── core/                 # Platform hub (/core)
│   ├── access/               # Accessible places
│   ├── driver/, worker/      # Field worker UIs
│   └── …                     # employer, plan-manager, assessor, billing, …
├── components/               # React UI (admin, care, transport, core shell, …)
├── lib/                      # Domain logic (~165 packages: auth, billing, care, cases, …)
│   ├── auth/                 # Sessions, permissions, roles
│   ├── integrations/       # Keycloak, Temporal, n8n, Directus, …
│   ├── transport/              # Trips, dispatch, eligibility
│   ├── transport-routing/        # OSRM / routing adapters
│   ├── cases/                  # Case management + AI engine
│   └── …
├── prisma/
│   ├── schema.prisma         # Unified PostgreSQL schema
│   ├── migrations/           # SQL migrations
│   └── seed*.ts              # Seed scripts
├── docs/
│   ├── mapable/              # Core hub, phases 1–12, Cursor prompts
│   ├── modules/              # Feature guides (care, transport, cases, …)
│   ├── operations/           # Neon, ops notes
│   ├── integrations/         # Env var reference
│   └── qa/                   # QA checklists
├── apps/
│   └── realtime-server/      # Socket.IO server (pnpm workspace)
├── mcp/
│   └── av/                   # Autonomous-vehicle MCP server
├── mobile-contracts/         # Mobile API / screen contracts
├── tests/                    # Vitest (`*.test.ts`)
├── types/                    # Shared TypeScript types
├── scripts/                  # CLI helpers (Neon env, integrations check, …)
├── data/
│   └── imports/              # Access KML/GeoJSON imports (often gitignored)
├── public/                   # Static assets
└── schemas/                  # JSON validation schemas
```

Config at repo root: `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `vercel.json`, `vitest.config.ts`.

## Documentation

Detailed guides live under `docs/`. This file is the only project README at the repository root.

### Platform

| Doc | Description |
| --- | --- |
| [docs/mapable/core.md](docs/mapable/core.md) | `/core` hub and integrations |
| [docs/mapable/ui.md](docs/mapable/ui.md) | Core UI shell |
| [docs/mapable/core-phases.md](docs/mapable/core-phases.md) | Phases 1–12 — routes, models, deploy |
| [docs/mapable/cursor-prompts-phases-6-10.md](docs/mapable/cursor-prompts-phases-6-10.md) | Cursor prompt packs (phases 6–10) |
| [docs/mapable/cursor-five-year-masterplan.md](docs/mapable/cursor-five-year-masterplan.md) | Cursor five-year strategic masterplan |

### Modules

| Doc | Description |
| --- | --- |
| [docs/modules/bookings.md](docs/modules/bookings.md) | Bookings foundation |
| [docs/modules/care.md](docs/modules/care.md) | Care MVP |
| [docs/modules/case-management.md](docs/modules/case-management.md) | Case management (AI-assisted) |
| [docs/modules/calendar.md](docs/modules/calendar.md) | Unified calendar |
| [docs/modules/consent.md](docs/modules/consent.md) | Consent model |
| [docs/modules/cross-module-orchestration.md](docs/modules/cross-module-orchestration.md) | Cross-module flows |
| [docs/modules/incidents.md](docs/modules/incidents.md) | Incident reporting |
| [docs/modules/jobs.md](docs/modules/jobs.md) | Inclusive jobs |
| [docs/modules/privacy-and-audit.md](docs/modules/privacy-and-audit.md) | Privacy and audit |
| [docs/modules/provider-capacity.md](docs/modules/provider-capacity.md) | Provider capacity |
| [docs/modules/transport.md](docs/modules/transport.md) | Transport module |
| [docs/modules/transport-scheduling.md](docs/modules/transport-scheduling.md) | Transport scheduling |
| [docs/modules/accessibility.md](docs/modules/accessibility.md) | Accessibility profiles |
| [docs/accessops/wave-12-accessops.md](docs/accessops/wave-12-accessops.md) | Wave 12 AccessOps civic access digital twin |
| [docs/governance/wave-13.md](docs/governance/wave-13.md) | Wave 13 public-interest governance, algorithm register, appeals and oversight |
| [docs/participation/wave-17.md](docs/participation/wave-17.md) | Wave 17 inclusive life planner and community participation |
| [docs/modules/admin-dashboard.md](docs/modules/admin-dashboard.md) | Admin dashboard |

Phase 2 and Phase 4 capabilities (messaging, documents, matching, timesheets, Stripe/Xero placeholders, etc.) are documented in [core phases](docs/mapable/core-phases.md#phase-2) and [phase 4](docs/mapable/core-phases.md#phase-4).

### Operations and integrations

| Doc | Description |
| --- | --- |
| [docs/design-system.md](docs/design-system.md) | UI tokens, components, module accents, maps |
| [docs/operations/neon.md](docs/operations/neon.md) | Neon Postgres |
| [docs/operations/replit-imports.md](docs/operations/replit-imports.md) | Import MapAble Repls (Care, Unified, Transport, Marketplace) |
| [docs/billing.md](docs/billing.md) | Billing |
| [docs/integrations/environment.md](docs/integrations/environment.md) | Integration environment variables |
| [docs/safety.md](docs/safety.md) | Safety and incident centre |
| [docs/av-mcp.md](docs/av-mcp.md) | AV / MCP transport |
| [docs/ndia-provider-claiming.md](docs/ndia-provider-claiming.md) | NDIA provider claiming |
| [docs/ndis-gateway/wave-2-private-claim-storage.md](docs/ndis-gateway/wave-2-private-claim-storage.md) | Wave 2 privacy-safe claim snapshots |
| [docs/ndis-gateway/claim-approval-governance.md](docs/ndis-gateway/claim-approval-governance.md) | Claim-specific approval rules |
| [docs/ndis-gateway/encryption-key-rotation.md](docs/ndis-gateway/encryption-key-rotation.md) | NDIS encryption key rotation |
| [docs/pilot/wave-7-controlled-pilot-operations.md](docs/pilot/wave-7-controlled-pilot-operations.md) | Wave 7 controlled pilot operations |
| [docs/ROUTING_SLUGS.md](docs/ROUTING_SLUGS.md) | Route slugs |

### NDIS Controlled Pilot (Wave 7)

Organisation-scoped `ControlledPilot` APIs and admin/participant UIs under `/admin/pilot` and `/participant/pilots`. Pilot approval is not production approval; empty allowlists deny; limited live is off by default; `NdiaPilotApprovalRecord` is not ControlledPilot authority; no real NDIA submission from pilot surfaces. Set `PILOT_ENFORCEMENT_ENABLED=false` unless intentionally gating payment paths. See [docs/pilot/](docs/pilot/).

### Participant-controlled credentials and consent federation (Wave 9)

Wave 9 adds an immutable `ConsentDirective` layer, a participant access vault, delegate authority (relationship ≠ authority), credential shells (OID4VCI / OID4VP / Bitstring Status List) and a mandatory disclosure gateway. **MapAble credentials are NOT government credentials.** All federation adapters default to simulator mode. Production activation requires `FEDERATION_ACTIVATION=true`, a passing `pnpm federation:conformance` run, and human-approved trust registry + schema entries. AI cannot approve consent, sign credentials, complete high-risk recovery or approve emergency access.

Participant UI: `/participant/vault`. Admin UI: `/admin/federation`. Provider UI: `/provider/federation`.

Scripts: `pnpm federation:conformance`, `federation:audit-consent`, `federation:audit-delegation`, `federation:audit-disclosures`, `federation:audit-identifiers`, `federation:test-issuance`, `federation:test-presentation`, `federation:test-status`, `federation:test-wallet-recovery`, `federation:test-accessibility` — all support `--dry-run` and require no DB in dry mode.

See [docs/federation/](docs/federation/) and threat models under [docs/security/](docs/security/).

### AURA participant-controlled agent OS (Wave 10)

Wave 10 introduces AURA (Automated Utility & Reasoning Assistant) — a bounded execution layer for participant-authorised agent planning. **AURA is not sentient, not a legal representative, not a medical practitioner, not a financial adviser, and not a substitute decision-maker.** AURA cannot escalate its own permissions, alter consent, appoint delegation, decide incident reportability, close safeguarding cases, release its own kill switch, or approve invoices/claims/payments (the Billing specialist is explain-only). All participant data egress continues to route through Wave 9 `discloseParticipantData`. Wave 8 tenant context is required on every mutation.

Set `AURA_ENABLED=false` (default) to keep everything simulator-side. MCP and A2A gateways are off by default; each server/peer additionally needs registration, conformance, and `productionActivated=true`. A2A is experimental. Legacy AI matching is retained as advisory only and the fix in `lib/ai-matching/ai-match-service.ts` separates deterministic `ruleScore` from optional `modelCommentaryScore` (never fabricated).

Participant UI: `/participant/aura`. Admin UI: `/admin/aura`. Provider UI: `/provider/aura`. Well-known agent card: `/.well-known/agent-card.json` (sandbox only).

Scripts: `pnpm aura:audit-actions`, `aura:audit-tools`, `aura:audit-authority`, `aura:audit-consent`, `aura:audit-memory`, `aura:audit-bypasses`, `aura:test-planning`, `aura:test-simulation`, `aura:test-execution`, `aura:test-compensation`, `aura:test-injection`, `aura:test-accessibility`, `aura:evaluate`, `aura:mcp:conformance`, `aura:a2a:conformance`, plus pack wrappers `aura:audit-ai-actions`, `aura:audit-automation-events`, `aura:audit-tool-registry`, `aura:audit-ai-tenant-scope`, `aura:audit-ai-consent`, `aura:migrate-ai-matching-runs`, `aura:backfill-agent-definitions`, `aura:classify-agent-actions`, `aura:audit-agent-memory`, `aura:audit-agent-bypasses` — all support `--dry-run` and require no DB in dry mode.

See [docs/aura/](docs/aura/) — especially `wave-10-architecture-and-risk-plan.md`, `wave-10-not-sentient.md`, and `wave-10-prohibited-actions.md`.

### Life events & service recovery (Wave 11)

Wave 11 adds a *projection* over Case, AURA, incidents/complaints, and bookings to reason about life events, service continuity, and deterministic service-recovery plans. It does not duplicate any of those systems. **Continuity preserves participant goals, not merely bookings.** Care cancellation does not auto-cancel linked transport — a continuity signal is raised and a continuity case is opened for a human decision. A new AURA `service-recovery` specialist drafts goal-preserving options and plans; it can never approve invoices/claims/payments, alter consent, or dispatch emergency services (000, ambulance, police, fire). External civic feeds default to disabled and untrusted until validated and fresh. Life events are always human-declared; AURA can suggest, never auto-create. Essential support is participant-defined — never inferred from diagnosis. See [docs/continuity/](docs/continuity/) — especially `wave-11-architecture-and-risk-plan.md`, `wave-11-emergency-boundary.md`, `wave-11-essential-support-boundary.md`, and `wave-11-aura-service-recovery-specialist.md`.

### AccessOps civic digital twin (Wave 12)

Wave 12 adds AccessOps for civic access assets, feature observations, operational status, reliability, incidents, work orders, sensors, partner v2 APIs, and disabled-by-default open-data projections. Accreditation is not live status; missing data is not accessible; stale data is not current; sensors do not actuate infrastructure; routes are advisory; participant journeys stay off operator dashboards. See [docs/accessops/](docs/accessops/).

### Inclusive life planner (Wave 17)

Wave 17 extends `ParticipationGoal` for participant-defined community participation, discovery, event access, plans, organiser portals, and AURA participation guardrails. It does not infer loneliness, score attendance, assume funding eligibility, duplicate bookings/calendar/access systems, or expose private reflections. See [docs/participation/](docs/participation/).

### QA and mobile

| Doc | Description |
| --- | --- |
| [docs/qa/phase-3.md](docs/qa/phase-3.md) | Phase 3 QA checklist |
| [mobile-contracts/MOBILE_APP_ARCHITECTURE.md](mobile-contracts/MOBILE_APP_ARCHITECTURE.md) | Mobile architecture |
| [mobile-contracts/MOBILE_SCREEN_MAP.md](mobile-contracts/MOBILE_SCREEN_MAP.md) | Mobile screen map |

## Code quality

ESLint, Prettier, Husky, and lint-staged run on commit. See `package.json` scripts.

## Import MapAble-Transport (Replit)

To pull the standalone Repl [@ausdisau1/MapAble-Transport](https://replit.com/@ausdisau1/MapAble-Transport) for comparison or merge, see [docs/operations/replit-mapable-transport-import.md](docs/operations/replit-mapable-transport-import.md) and run `./scripts/import-replit-transport.sh`. The module entry in this app is `/transport`.

## Data imports (Access)

Legacy place data for admin import lives under `data/imports/` (often gitignored when large). Copy `MapAble.kml` or `accessible_locations_merged.geojson` from operations storage, or use **Admin → Access → Import**. GeoJSON expects a FeatureCollection with Point features and properties such as `name`, `category`, or `address`.

## License

ISC

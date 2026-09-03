# MapAble Innovation — Architecture Baseline

**Document type:** As-built architecture snapshot  
**Status:** Evidence-backed baseline (Prompt 00)  
**Date:** 2026-09-02  
**Repository:** [MapAbleAU](https://github.com/ausdisau/MapAble)  
**Production:** https://mapable.com.au

> **MRFF disclaimer:** References to the 2016–2021 Australian Medical Research and Innovation Strategy elsewhere in this programme are **historical translation precedents only**. They are not the current 2026 funding strategy and do not constitute proof of present grant eligibility.

---

## Mission framing

MapAble is not a general-purpose mapping platform. It is an **accessibility-aware mobility intelligence layer** whose central question is:

> Can this particular person reliably traverse this journey, under these conditions, and what evidence supports that conclusion?

This baseline documents what exists in the repository today — not the target architecture.

---

## Repository topology (actual layout)

The prompt-series template references `apps/web/` and `apps/mobile/`. The repository reality differs:

```mermaid
flowchart TB
  subgraph root [Repo_root_Next_js_web]
    app[app/ App Router ~747 API routes]
    components[components/ ~91 dirs]
    lib[lib/ ~975 TS modules]
    prisma[prisma/ unified schema]
  end
  subgraph packages [packages/]
    contracts[@mapable/contracts]
    sdk[@mapable/sdk]
    domain[domain-transport provider workforce]
    kernel[intelligence-kernel]
  end
  subgraph mobile [Mobile_surfaces]
    android[apps/android Kotlin MapLibre]
    independence[apps/independence Expo 57]
    companion[apps/companion Expo 52]
    realtime[apps/realtime-server Socket.io]
  end
  subgraph legacy [Legacy_read_only]
    server[server/ Express twin]
    client[client/ Vite twin]
  end
  root --> packages
  mobile --> root
```

| Prompt template path | Repository reality |
|---------------------|-------------------|
| `apps/web/` | Next.js 15 at **repo root** (`app/`, `components/`, `lib/`) |
| `apps/mobile/` | `apps/android/`, `apps/independence/`, `apps/companion/` |
| `packages/accessibility`, `routing`, etc. | Domain logic in `lib/`; packages hold contracts + SDK |
| `services/` | No top-level services directory; APIs in `app/api/` |
| PostGIS | **Not used** — lat/lng + GeoJSON jsonb, app-side evaluation |

**pnpm workspace members:** root web app, `apps/realtime-server`, `packages/*`. Expo apps install independently (SDK drift).

---

## Runtime stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Hosting | Vercel | `vercel.json`, cron for NDIS ingest |
| Database | Neon PostgreSQL | `DATABASE_URL` + `DIRECT_URL` via Prisma |
| ORM | Prisma 6.19 | Single schema, 15,793 lines, 98 migrations |
| Web framework | Next.js 15.5 | App Router, React 18 |
| Auth | NextAuth 4 + WebAuthn | `lib/auth/*` |
| Maps | MapLibre GL + OpenStreetMap | `components/map/MapLibreMap.tsx`, `lib/map/*` |
| Pedestrian routing | `lib/access/navigate/`, `lib/go/` | Sandbox graph for Go; not national live |
| Vehicle routing | OSRM, GraphHopper, OpenRouteService, mock | `lib/transport/routing/` |
| Valhalla | **Not present** | — |
| Analytics | PostHog (LLM only), custom product bus | `lib/analytics/llm-analytics.ts` |
| Workflows | Temporal (scaffolded, default off) | `TEMPORAL_ENABLED=false` |
| CI | GitHub Actions | typecheck, vitest, Playwright/axe, migrations |

---

## Domain module map

| Domain | Primary paths | Role |
|--------|---------------|------|
| Access graph / evidence | `lib/access/infrastructure/`, `lib/access/intelligence-next/evidence/`, `lib/access/navigate/` | Ontology, provenance, observations, routing |
| MapAble Go | `lib/go/route-service.ts`, `app/api/go/*` | Participant navigation (sandbox graph) |
| Transport routing | `lib/transport/routing/` | Vehicle ETA/optimisation adapters |
| Indoor accessibility | `lib/access/indoor/` | Floor plans, indoor route planner |
| Consent | `lib/consent/` | `grantConsent`, `revokeConsent`, micro-consent |
| Research | `lib/research/` | Projects, ethics, safe-room scaffold |
| Trust fabric | `lib/trust/fabric/` | Disclosure receipts, break-glass |
| Maps UI | `components/map/`, `lib/map/` | MapLibre, geojson, nominatim |
| Co-design policy | `docs/co-design-protocol.md` | HITL AI engagement charter (policy) |
| Portfolio SoT | `docs/innovation/MAPABLE_INNOVATION_PORTFOLIO.md` | Programme index, claim states |

**File counts (2026-09-02 audit):** 134 TypeScript files under `lib/access/`, 747 `app/api/**/route.ts` handlers, 373 Vitest test files.

---

## Data layer (key Prisma models)

| Model | Purpose | Claim state |
|-------|---------|-------------|
| `AccessPlace` | Canonical place SoT | Implemented (discovery) |
| `AccessObservationRecord` | Evidence observations | In development |
| `AccessPathNode`, `AccessPathSegment` | Outdoor path graph | In development (sandbox routing) |
| `AccessTemporaryBarrier` | Dynamic barriers | In development |
| `AccessPassport` | Functional access requirements | Implemented, not verified |
| `ConsentRecord` | Purpose-bound consent | Implemented, flagged |
| `ResearchProject` | Research governance | Proposed / synthetic default |
| `GoRoutePlan` | Planned routes | In development |

Geo is stored as float lat/lng and GeoJSON jsonb — evaluated in application code, not PostGIS.

---

## API surface (representative)

| Prefix | Purpose |
|--------|---------|
| `app/api/access/*` | Places, navigate, evidence graph, infrastructure |
| `app/api/access-intelligence-next/*` | Living fabric graph, evidence, temporal state |
| `app/api/go/*` | Routes, profile, barriers, location |
| `app/api/v1/*` | Versioned public API (access, transport, care, jobs) |
| `app/api/v2/places` | Places v2 |
| `app/api/mobile/bootstrap` | Mobile policy (MapLibre + OSM) |
| `app/api/research/*` | Minimal today; services in `lib/research/` |

---

## Mobile surfaces

| App | Stack | Access integration |
|-----|-------|-------------------|
| `apps/android/` | Kotlin, MapLibre, modular features | `feature/access/MapLibreAccessPolicy.kt`, `AccessRepository.kt` |
| `apps/independence/` | Expo 57 | `src/runtime/mapableApi.ts` |
| `apps/companion/` | Expo 52 | Visit pack, device enrolment |
| `apps/realtime-server/` | Socket.io | Realtime (flag-gated) |

Offline regional packs and resilient navigation are **not implemented** (planned Prompt 07).

---

## CI/CD gates

| Workflow | Purpose |
|----------|---------|
| `.github/workflows/ci.yml` | prisma validate, type-check, lint, `pnpm test`, build |
| `.github/workflows/accessibility.yml` | Seed a11y users, Playwright + axe |
| `.github/workflows/migrations.yml` | Migration integrity on Postgres 16 |
| `.github/workflows/android.yml` | Gradle assemble + tests |

Pre-push hook: `pnpm type-check && format:check && lint && lint-staged`.

---

## Claim-state summary (major capabilities)

| Capability | Claim state | Anchor |
|------------|-------------|--------|
| Identity & auth | Implemented | NextAuth, passkeys |
| Access place discovery | Implemented | `AccessPlace`, `lib/access/*` |
| Access evidence graph | In development | intelligence-next, flag-gated persistence |
| Personal access passport | Implemented, not verified | `AccessPassport`, trust fabric |
| Accessible routing (Go) | In development | Sandbox graph only |
| Vehicle routing | Implemented (mock default) | `TRANSPORT_ROUTING_PROVIDER=mock` |
| Consent service | Implemented, flagged | `lib/consent/*` |
| Research governance | Proposed | `lib/research/`, synthetic-only default |
| Co-design protocol | Policy implemented | `docs/co-design-protocol.md` |
| Enterprise accessibility API | Proposed | Partial `app/api/v1/access/` |
| Privacy data lanes | Proposed | Plan 08 not implemented |
| Governed AI evidence | Exploratory | intelligence-next partial |
| Offline navigation packs | Proposed | Not implemented |
| WCAG manual evidence | NOT_RUN | `docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md` |

---

## Verification baseline (Prompt 00 audit)

Captured 2026-09-02 on branch `cursor/innovation-architecture-baseline-dee8`.

### Type-check (`pnpm type-check`)

**Result: FAIL (pre-existing)**

```
components/mapable-app/MapAbleApp.tsx(684,29): error TS1127: Invalid character.
components/mapable-app/MapAbleApp.tsx(685,14): error TS1381: Unexpected token.
components/mapable-app/MapAbleApp.tsx(687,11): error TS1382: Unexpected token.
components/mapable-app/MapAbleApp.tsx(724,10): error TS1005: ';' expected.
components/mapable-app/MapAbleApp.tsx(725,7): error TS1128: Declaration or statement expected.
components/mapable-app/MapAbleApp.tsx(726,5): error TS1109: Expression expected.
components/mapable-app/MapAbleApp.tsx(727,3): error TS1109: Expression expected.
components/mapable-app/MapAbleApp.tsx(728,1): error TS1128: Declaration or statement expected.
```

8 errors in a single file. **Not introduced by Prompt 00** (docs-only PR).

### Unit tests (`pnpm test`)

**Result: 3 failures / 2142 passed (pre-existing)**

| Test file | Failure |
|-----------|---------|
| `tests/booking-rag-scope.test.ts` | Prisma client not initialised in test context |
| `tests/access/access-graph-observation-service.test.ts` | Expected `community_reported` / `ai_inferred`, received `expired` (freshness engine) |

```
Test Files  2 failed | 394 passed | 1 skipped (397)
Tests       3 failed | 2142 passed | 2 skipped (2147)
Duration    42.97s
```

**Not introduced by Prompt 00** (docs-only PR).

---

## Technical debt register (priority signals)

1. **Monolithic Prisma schema** — 15,793 lines; high coupling, slow tooling
2. **Dual intelligence trees** — `intelligence/` vs `lib/intelligence/careos/`
3. **Go routing on sandbox fixture** — `lib/go/route-service.ts` uses `getSandboxGraph()`, not live national graph
4. **Fragmented evidence systems** — accreditation, compliance, transport, intelligence-next lack unified package
5. **Three routing engines** — pedestrian (`lib/access/navigate`), vehicle (`lib/transport/routing`), indoor (`lib/access/indoor`)
6. **PostHog limited to LLM analytics** — no product analytics sanitizer or consent middleware
7. **Temporal scaffolded, default off** — single complaint-acknowledgement workflow
8. **README drift** — references `apps/web` and `apps/mobile` that do not exist
9. **Legacy Replit twin** — `server/`, `client/` marked read-only but still in tree
10. **Expo SDK drift** — companion (52) vs independence (57), outside pnpm workspace
11. **Manual WCAG matrix** — all rows `NOT_RUN`
12. **Type-check failure** — `MapAbleApp.tsx` syntax errors block clean CI typecheck

---

## Related documents

- [Gap analysis](./gap-analysis.md) — current vs target architecture
- [Implementation roadmap](./implementation-roadmap.md) — sequenced PR programme
- [Research translation model](./research-translation-model.md) — MRFF-informed sequencing rationale
- [MAPABLE_INNOVATION_PORTFOLIO.md](./MAPABLE_INNOVATION_PORTFOLIO.md) — programme SoT
- [Superpowers phase plans](../superpowers/plans/README.md) — executable prompt series

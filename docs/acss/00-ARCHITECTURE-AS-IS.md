# MapAble ACSS — Architecture As-Is

**Phase:** 0 — Repository Discovery  
**Product doctrine:** MapAble Agentic Care & Support System (ACSS)  
**Rule:** The repository is the source of truth. This document describes what exists today.

**Constitutional principle (already present in MapAble AI doctrine):**  
Human agency above artificial agency. Agents propose; humans approve; deterministic services execute. AI is never the authorisation authority. See [AGENTIC_NERVE_CENTRE.md](../ai-platform/AGENTIC_NERVE_CENTRE.md).

---

## 1. Repository identity

| Item | Value |
|------|--------|
| Package name | `MapableAU` (`package.json`) |
| Version | `1.0.1` |
| Package manager | `pnpm@10.12.1` |
| Workspace | [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) |
| Primary app | Root Next.js application (not under `apps/web` in this tree) |
| Canonical status note | Root [`README.md`](../../README.md) describes amalgamation history toward `ausdisau/MapAble`; **this tree remains a full runnable MapAbleAU platform** and is the working source for ACSS discovery |
| React | `react@^18` |
| Route Handlers | ~758 `app/**/route.ts` |
| Pages | ~563 `app/**/page.tsx` |
| Server Actions | Rare (`"use server"` in 2 page files only) — APIs dominate |

There is **no** product module named `ACSS` in code today. Closest adjacent doctrine: Adaptive Access Runtime (`docs/adaptive-access/`) and the AI Platform / Agentic Nerve Centre (`docs/ai-platform/`).

### Repository inventory (actual top-level)

| Area | Paths present |
|------|----------------|
| Application | `app/`, `components/`, `hooks/`, `styles/` |
| Libraries | `lib/`, `shared/`, `types/`, `schemas/` |
| Packages | `packages/*`, `apps/realtime-server` |
| Mobile | `apps/companion`, `apps/independence`, `mobile/`, `mobile-contracts/` |
| Database | `prisma/`, `migrations/`, `supabase/` |
| AI | `lib/ai/`, `intelligence/`, `mcp/` |
| Security | `security/`, `middleware.ts`, auth under `lib/auth/` |
| Tests | `tests/`, `e2e/` |
| Scripts / CI | `scripts/`, `.github/workflows/` |
| Docs | `docs/` (incl. `docs/acss/`) |
| Assets | `public/`, `design/`, `attached_assets/` |
| Deployment | `vercel.json`, `next.config.ts` |
| Dual/legacy | `server/`, `client/`, `amalgamation/`, Replit configs |
| Infra | `infra/`, `ports/`, `research/` |

**Absent at root:** `turbo.json`, `nx.json`, `yarn.lock`, `bun.lock`, `src/`, `pages/`.

---

## 2. Framework and application structure

| Concern | Reality |
|---------|---------|
| Framework | **Next.js 15.5.21** (pinned in `package.json`) |
| Router | **App Router only** — [`app/`](../../app/) |
| Pages Router | Not present (`pages/` absent) |
| `src/` directory | Not used for the main app |
| Config | [`next.config.ts`](../../next.config.ts), [`middleware.ts`](../../middleware.ts), [`instrumentation.ts`](../../instrumentation.ts) |
| Scale (approx.) | Hundreds of `page.tsx` and `route.ts` handlers under `app/` |

### Top-level layout (selected)

| Path | Role |
|------|------|
| `app/` | Next.js routes, layouts, API route handlers |
| `components/` | React UI by domain |
| `lib/` | Shared domain libraries (auth, AI platform, consent, billing, …) |
| `prisma/` | Schema + migrations (system of record) |
| `intelligence/` | CareOS / OpenAI Agents SDK network |
| `packages/` | Workspace packages (`domain-*`, `ui`, `contracts`, `intelligence-kernel`, …) |
| `apps/realtime-server` | In-workspace realtime service |
| `apps/companion`, `apps/independence` | Expo apps (independent installs; not in pnpm workspace list) |
| `mcp/` | Dev/host MCP servers (stdio) |
| `server/` | Replit dual-stack chat/integrations side path |
| `docs/` | Large documentation set (~400+ files) |
| `tests/`, `e2e/` | Vitest + Playwright |

### Route groups (sample)

- `app/(marketing)/` — public marketing surfaces
- `app/(core)/` — governance / accountability / status
- Domain trees: `dashboard/`, `care/`, `careos/`, `participant/`, `provider/`, `transport/`, `navigator/`, `admin/`, `billing/`, …
- API: `app/api/**` including `auth/`, `ai/`, `navigator/`, `intelligence/`, `orchestration/`, …

Supporting structure: [`docs/lib-structure.md`](../lib-structure.md).

---

## 3. Frontend

- React Server Components + client components under `app/` and `components/`
- State: Zustand, TanStack Query (dependencies in `package.json`)
- Maps: MapLibre / Leaflet
- Accessibility package: `@mapable/accessibility` (`packages/accessibility`)
- UI package: `@mapable/ui` (`packages/ui`)
- Analytics: PostHog (env-gated)
- Design system docs: [`docs/design-system.md`](../design-system.md)

Accessibility is treated as a product requirement (dedicated CI workflow `.github/workflows/accessibility.yml`, Playwright a11y suites).

---

## 4. Backend / server-side execution

| Pattern | Location / notes |
|---------|------------------|
| Route Handlers | `app/api/**/route.ts` (~758) |
| Server Actions | Minimal (`"use server"` in 2 pages) — not the primary mutation surface |
| Middleware | [`middleware.ts`](../../middleware.ts) — NextAuth JWT, CSP, host routing |
| Domain services | `lib/**` service modules |
| CareOS / intelligence | `intelligence/**` + `app/api/intelligence/**` |
| Background / durable | Temporal **source** (`lib/workflows/temporal/`, `TEMPORAL_ENABLED`) — **no `@temporalio` pkgs in root package.json** — plus Prisma `WorkflowRun` via `lib/platform/durable-workflow-service.ts` |
| Cron | Vercel Cron in [`vercel.json`](../../vercel.json) → NDIS provider ingest |

**Do not assume** Vercel Queues or Vercel Workflow — they are not dependencies today.

### Runtime map

| Runtime | What runs there |
|---------|-----------------|
| Browser | Client components, maps, `useChat`, consent wallet UI |
| Server (Node / Vercel Functions) | Most Route Handlers, Prisma, AI gateway calls, domain services |
| Edge | `middleware.ts` (auth token + CSP) |
| Worker / external | Temporal worker (if enabled), `apps/realtime-server`, MCP stdio hosts |
| Ephemeral FS | Local document mode — **not** suitable for Vercel production |

---

## 5. Monorepo / workspace packages

From [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml):

```text
.
apps/realtime-server
packages/*
```

Notable packages:

| Package | Path |
|---------|------|
| `@mapable/domain-provider` | `packages/domain-provider` |
| `@mapable/domain-transport` | `packages/domain-transport` |
| `@mapable/domain-workforce` | `packages/domain-workforce` |
| `@mapable/intelligence-kernel` | `packages/intelligence-kernel` |
| `@mapable/contracts` | `packages/contracts` |
| `@mapable/ui` | `packages/ui` |
| `@mapable/sdk` | `packages/mapable-sdk` |
| `@mapable/accessibility` | `packages/accessibility` |

**Absent:** Turbo, Nx, Lerna.

---

## 6. Dual stacks to be aware of (do not merge blindly)

1. **Canonical AI Platform** — `lib/ai/platform/**` + docs under `docs/ai-platform/`  
   Capability registry, agent manifests, mission runtime, action kernel, guardian, model gateway.
2. **CareOS / intelligence network** — `intelligence/**`  
   `@openai/agents` orchestration; CareOS agent network is a **deprecated compatibility adapter** relative to the eight operational agents (see Agentic Nerve Centre docs).
3. **Replit dual path** — `server/`, `package.replit.json`, `.env.replit.example`  
   Separate OpenAI chat/audio integrations. Not the ACSS evolution target unless explicitly bridging.

ACSS work must prefer (1), reuse (2) only via documented adapters, and avoid expanding (3).

---

## 7. CI / CD

GitHub Actions under [`.github/workflows/`](../../.github/workflows/):

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | pnpm, Prisma, type-check, format, lint, build (Postgres 16 service) |
| `quality.yml` | Quality gates |
| `security.yml`, `semgrep.yml`, `codeql.yml` | Security |
| `accessibility.yml` | A11y |
| `migrations.yml` | Migration integrity |
| `careos-validation.yml`, `careos-release.yml` | CareOS |
| `production-claims.yml` | Claim honesty |
| `convergence-advisory.yml` | ConvergenceOS advisory |
| Sync workflows | Cursor ↔ Replit branch sync |

Deploy path: **Vercel** (Next.js) implied by `vercel.json` + Next build. No Kubernetes / microservice rewrite is present or required for ACSS.

---

## 8. What not to rewrite

- Do not invent a second Next.js app for ACSS.
- Do not replace Prisma/Neon with a parallel database.
- Do not replace NextAuth with a different auth product without an explicit product decision.
- Do not create a parallel agent registry alongside `lib/ai/platform/agents/`.
- Do not create permanently running in-memory agents.
- Do not treat prompt-only rules as governance enforcement.

See Architecture Decision in [10-IMPLEMENTATION-ROADMAP.md](./10-IMPLEMENTATION-ROADMAP.md) (evolve `lib/ai/platform` in place).

---

## 9. Related documentation

- [`docs/ai-platform/CURRENT_STATE.md`](../ai-platform/CURRENT_STATE.md)
- [`docs/ai-platform/ARCHITECTURE.md`](../ai-platform/ARCHITECTURE.md)
- [`docs/ai-platform/AGENTIC_NERVE_CENTRE.md`](../ai-platform/AGENTIC_NERVE_CENTRE.md)
- [`docs/cloud-platform-architecture.md`](../cloud-platform-architecture.md)
- [`docs/lib-structure.md`](../lib-structure.md)
- [`docs/remediation/DOMAIN_OWNERSHIP.md`](../remediation/DOMAIN_OWNERSHIP.md) (when present)

---

## 10. Discovery summary

MapAble is a large, Vercel-hosted Next.js 15 disability-support platform with a mature (mostly flag-gated) AI Platform. **ACSS is an evolution of that platform’s doctrine and contracts**, not a greenfield rewrite.

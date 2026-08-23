# MapAble Labs Experiment Runtime — reuse decisions

Status: in development  
Branch: `feat/mapable-labs-subdomain` (PR #517)

## Inspected foundation

| Area | Finding | Decision |
|------|---------|----------|
| `app/labs/**` | Shell, landing, Mobility Futures placeholder | Reuse layout/brand; replace placeholder with runtime-driven UI |
| `lib/labs/host-routing.ts` | Subdomain rewrite helpers | Keep unchanged |
| `middleware.ts` | Labs host rewrite | Keep unchanged |
| `docs/architecture/mapable-labs-subdomain.md` | Safety / claim boundary | Extend with Experiment Runtime section |
| GAIS | Contracts, evidence write paths (`telemetry`, change-review persist) | **Read-only conceptual reuse** of observation *types* as synthetic fixtures. **Never import** GAIS evidence-write / persist modules from Labs runtime |
| MapAble Go | Autonomy-adjacent routing language, barrier types | Reuse naming for events (`TEMPORARY_OBSTRUCTION`, `LIFT_OUTAGE`) as synthetic scenario vocabulary only |
| Personal Agency | Authority / consent framing | Mirror “participant decides” language in Agency Timeline actors — no PAI persistence |
| Audit events | `createAuditEvent` for production mutations | **Do not call** from Labs P0; simulation data stays client-side / in-memory |
| A11y tests | `@testing-library/react`, Playwright axe suite | Unit tests with Testing Library + keyboard/SR roles; axe via `axe-core` in Labs vitest where feasible |

## What we build

Reusable **Experiment Runtime** inside the existing Next.js app — not a second application.

- Typed contracts under `lib/labs/contracts/`
- Deterministic reducer under `lib/labs/runtime/`
- One experiment: Mobility Futures synthetic journey
- Shared UI components under `components/labs/`

## Explicit non-reuse

- No GAIS telemetry ingest / promote / evidence persist
- No Go barrier reporting APIs
- No PAI life-intent or profile writes
- No physical device / actuation schemas
- No behavioural tracking persistence (feedback client-side only)
- No 3D / WebXR / camera / LiDAR

## Simulation boundary invariant

All Labs runtime outputs carry `LABS_SIMULATION_DATA: true`.  
Static analysis / unit tests assert Labs runtime modules do not import production GAIS write services.

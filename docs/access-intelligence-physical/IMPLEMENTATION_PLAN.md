# Access Intelligence Physical Systems — Implementation Plan

## Detected architecture (MapAbleAU)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router, React 18 |
| Package manager | pnpm |
| AI | AI SDK 6 — `ToolLoopAgent`, typed tools, `needsApproval`, `Output.object` |
| Validation | Zod (schemas in `lib/access-intelligence` + physical extensions) |
| ORM | Prisma 6 — existing `ai_*` tables + new physical tables |
| Auth | NextAuth + `AiVenueStaffAssignment` / platform admin |
| Tests | Vitest (+ Testing Library for UI) |
| Realtime | Polling primary; SSE fallback when long-lived streams are available |

Physical Systems **extends** Access Intelligence Core. It does not fork fit, route, confidence, Living Twin, or Trust Kernel.

## Reuse (do not reimplement)

| Existing module | Role in Physical |
|-----------------|------------------|
| `fit-engine.ts` / `decision-engine/` | Personal fit for visit decisions |
| `route-engine.ts` / `route-cost.ts` | Dijkstra + hard passport constraints + text instructions |
| `confidence-engine.ts` | Evidence confidence labels |
| `living/` (Harbour Civic, temporal, counterfactual, coverage) | Living Access Twin graph and demo events |
| `rights/action-policy.ts` + `audit.ts` | Trust Kernel consent / approval / audit |
| `live/` | Read-only live status cascade (demo + optional HTTP BMS **status**) |
| `adapters/` | Messaging + BMS **propose-only** patterns |
| `agent.ts` / `tools.ts` | ToolLoopAgent pattern; physical tools are additive |
| Prisma `ai_*` | Passports, places, elements, features, evidence, routes, incidents, audit |

## Domain boundaries

| Domain | Owns | Must not own |
|--------|------|--------------|
| Core Access Intelligence | Passport, twin, evidence, fit/route/confidence | Device I/O |
| Trust Kernel | Consent, field minimisation, approvals, audit | Actuation |
| **Safety Kernel** | Prohibited registry, preconditions, fail-closed gates | LLM narration |
| **Action Gateway** | Action state machine, idempotency, dispatch queue | Direct adapter calls from agent |
| Device adapters | Mock / future protocol scaffolds | Policy decisions |
| Agent | Narrate, propose, call read tools | Device commands |
| Presentation | Scout / Concierge / Venue Ops / Simulator UI | Safety logic |

Invariant: **the agent never calls devices**. Path is always:

`Agent proposal → Trust Kernel (if personal data) → Safety Kernel → Action Gateway → adapter (mode-gated)`.

## Operating modes

| Mode | Behaviour | Default |
|------|-----------|---------|
| `demo` | Synthetic Harbour Civic twin; labelled mocks; no external I/O | On in local/demo |
| `shadow` | Real observations may be ingested; actions simulated and logged, never dispatched | Pilot readiness |
| `supervised` | Human approval required before every dispatch; adapters may be real when enabled | Opt-in pilot |
| `live` | Autonomy ladder levels that allow automatic dispatch | **Disabled by default** |

Live requires explicit env enablement **and** production readiness checklist completion. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Target layout under `lib/access-intelligence/physical/`

```
lib/access-intelligence/physical/
  index.ts                 # public exports
  configuration.ts         # modes, feature flags, live kill-switch
  schemas.ts               # Zod: Observation, Action, DeviceCapability, …
  ontology.ts              # physical element/capability extensions
  safety/
    kernel.ts              # Safety Kernel entry
    checks.ts              # precondition / interlock checks
    prohibited-registry.ts # immutable prohibited actions
    fail-closed.ts
  actions/
    state-machine.ts       # draft → … → terminal states
    gateway.ts             # Action Gateway orchestration
    idempotency.ts
    types.ts
  adapters/
    types.ts               # DeviceAdapter interfaces
    mock-bms.ts            # labelled mock
    mock-lift.ts
    mock-door.ts
    scaffolds/             # BACnet / MQTT / WoT / ROS — not connected
  scout/                   # observation capture helpers
  services/
    observations.ts
    decisions.ts
    routes.ts              # wraps route-engine
    realtime.ts            # poll + SSE fallback
    simulator.ts
  agent/
    tools.ts               # physical ToolLoopAgent tools (propose only)
    instructions.ts
```

App Router surfaces (stubbed):

- UI: `app/access-intelligence/physical/{scout,plan,passport,visits,actions,simulator}`
- API: `app/api/access-intelligence/physical/{chat,places,passports,routes,decisions,observations,actions,visit-plans,simulator}`

## Prisma: existing `ai_*` + new physical tables

**Reuse as-is:** `AiAccessPassport`, `AiAccessRequirement`, `AiAccessPlace`, `AiBuildingElement`, `AiAccessFeature`, `AiAccessEvidence`, `AiRouteNode`, `AiRouteEdge`, `AiLiveIncident`, `AiVisitPlan`, `AiVerificationRequest`, `AiBarrierReport`, `AiAccessAuditEvent`, Living Twin meta/rules/mutations/sessions/staff/snapshots.

**New tables (planned migration):**

| Table | Purpose |
|-------|---------|
| `ai_physical_observations` | Scout / feed observations with source type + calibration flags |
| `ai_physical_actions` | Action records + state machine fields + idempotency key |
| `ai_physical_action_events` | Append-only transition log |
| `ai_device_bindings` | Place/element → adapter capability (mock vs scaffold) |
| `ai_safety_decisions` | Kernel allow/deny with check codes (no passport body) |
| `ai_physical_mode_audit` | Mode changes and live enablement events |

Migration plan:

1. Add Prisma models + migration under `prisma/migrations/` (timestamped).
2. Keep demo default on in-memory / Harbour fixtures.
3. Opt-in Prisma via existing `ACCESS_INTELLIGENCE_USE_PRISMA` plus physical-specific flags.
4. Never enable live dispatch in the same PR that adds tables.

## AI SDK 6 usage

- Extend `ToolLoopAgent` with physical **read** and **propose** tools only.
- Write/dispatch tools set `needsApproval: true` and route through Safety Kernel + Action Gateway.
- Structured outputs remain Zod-backed (`Output.object`).
- Engines stay deterministic; the model narrates tool results and must not invent measurements or device state.

## Realtime: polling + SSE fallback

1. **Primary:** client poll of `/api/access-intelligence/physical/actions` and live-status endpoints (aligned with existing Living Operate patterns).
2. **Fallback:** SSE stream when the deployment supports long-lived responses; clients degrade to poll on disconnect.
3. No WebSocket dependency in v1. No claim of sub-second closed-loop control.

## Test strategy

| Layer | Coverage |
|-------|----------|
| Unit | Safety Kernel fail-closed, prohibited registry immutability, state-machine transitions, idempotency |
| Unit | Route wrapper still returns text instructions; fit/confidence unchanged |
| Contract | Agent tools never expose `dispatch` / adapter execute |
| Mode | Live flag off by default; supervised requires approval; shadow never calls adapter execute |
| Adapter | Mocks labelled `mock: true`; scaffolds throw / return `not_connected` |
| Integration | Vitest API route happy/deny paths with demo fixtures |
| A11y | Map-free route lists, live-region restraint (see [ACCESSIBILITY.md](./ACCESSIBILITY.md)) |

## Risks

| Risk | Mitigation |
|------|------------|
| Mode confusion (demo treated as live) | Explicit banners; env kill-switch; audit on mode change |
| Agent bypass of Safety Kernel | No adapter imports in agent tools; gateway is sole dispatch entry |
| Replay / double dispatch | Idempotency keys + terminal state guards |
| Stale telemetry | Freshness checks; unknown preferred over wrong actuate |
| Passport leakage in metrics | Observability denylist ([OBSERVABILITY.md](./OBSERVABILITY.md)) |
| Premature hardware | Scaffolds not connected; [REAL_HARDWARE_ROADMAP.md](./REAL_HARDWARE_ROADMAP.md) |

## Delivery order

1. Docs + schemas + Safety Kernel + Action state machine (this suite).
2. Mock adapters + Simulator + Scout observation path on Harbour Civic.
3. Concierge / plan UI reusing fit + route engines.
4. Shadow mode logging against mocks.
5. Supervised pilot with human approval (no live default).
6. Hardware only after roadmap gates — live remains off until checklist signed.

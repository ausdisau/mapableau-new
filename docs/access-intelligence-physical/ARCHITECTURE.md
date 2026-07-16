# Architecture — Access Intelligence Physical Systems

## Stack invariants (detected)

Next.js 15 App Router · React 18 · Zod · Prisma 6 (`ai_*`) · NextAuth · AI SDK 6 `ToolLoopAgent` · Vitest.

Physical code lives under `lib/access-intelligence/physical/`. Core engines stay in `lib/access-intelligence/` and are imported, not copied.

## Layers

```
┌─────────────────────────────────────────────────────────┐
│ Presentation — Scout, Concierge, Venue Ops, Simulator   │
│ app/access-intelligence/physical/* + components         │
├─────────────────────────────────────────────────────────┤
│ Agent — ToolLoopAgent propose/narrate only              │
│ physical/agent/tools.ts (no adapter.execute imports)    │
├─────────────────────────────────────────────────────────┤
│ Application — observations, decisions, visit plans      │
│ physical/services/*  + Core fit/route/confidence        │
├─────────────────────────────────────────────────────────┤
│ Safety — Safety Kernel + Trust Kernel (consent)         │
│ physical/safety/*  + rights/action-policy.ts            │
├─────────────────────────────────────────────────────────┤
│ Domain — Action state machine, ontology, schemas        │
│ physical/actions/*  + living twin + Core schemas        │
├─────────────────────────────────────────────────────────┤
│ Infrastructure — Prisma, polling/SSE, device adapters   │
│ physical/adapters/* (mocks + disconnected scaffolds)    │
└─────────────────────────────────────────────────────────┘
```

| Layer | Responsibility |
|-------|----------------|
| **Domain** | Action states, device capability types, observation/evidence rules, twin elements |
| **Application** | Use-cases: plan visit, ingest observation, propose action, simulate scenario |
| **Infrastructure** | Persistence, HTTP, poll/SSE, adapter I/O |
| **Agent** | Natural language + tool calls; never bypasses Safety Kernel |
| **Safety** | Fail-closed checks, prohibited registry, consent gates |
| **Presentation** | Accessible UI; map-free routes; restrained live regions |

## Autonomy ladder (0–5)

| Level | Name | System may… | Default availability |
|-------|------|-------------|----------------------|
| 0 | Observe | Ingest telemetry / Scout reports | All modes |
| 1 | Inform | Surface status & unknowns to humans | All modes |
| 2 | Advise | Recommend routes / workarounds via engines | Demo+ |
| 3 | Draft | Create `draft` / `proposed` actions | Demo+ |
| 4 | Supervised act | Dispatch only after human approval | `supervised` only |
| 5 | Live act | Dispatch per policy without per-action human | `live` only — **flag off by default** |

Simulator and shadow mode may exercise levels 0–3 (and simulate 4–5) without real adapters.

## Agent never calls devices

```
User / Concierge / Venue Ops
        │
        ▼
ToolLoopAgent (propose_action, calculatePersonalFit, buildAccessibleRoute, …)
        │  proposal only
        ▼
Trust Kernel (if passport / PII fields involved)
        │
        ▼
Safety Kernel (fail-closed; prohibited registry)
        │  allow
        ▼
Action Gateway (state machine + idempotency)
        │
        ▼
Device adapter  ← only here; mode must permit execute
```

Denied or uncertain Safety Kernel outcomes **stop** the chain. Adapters are not imported by agent tool modules.

## Realtime

- Poll action + incident endpoints for Venue Ops / Simulator.
- Optional SSE when `ACCESS_INTELLIGENCE_PHYSICAL_SSE=true`; clients fall back to poll.

## Modes vs layers

| Mode | Agent | Safety Kernel | Gateway dispatch |
|------|-------|---------------|------------------|
| demo | On | On (against mocks) | Mock execute only |
| shadow | On | On | Log-only / dry-run |
| supervised | On | On | Real adapter only after approval |
| live | On | On | Real adapter per policy — disabled by default |

## Related

[SAFETY_KERNEL.md](./SAFETY_KERNEL.md) · [ACTION_STATE_MACHINE.md](./ACTION_STATE_MACHINE.md) · [DEVICE_ADAPTERS.md](./DEVICE_ADAPTERS.md) · Core [ARCHITECTURE.md](../access-intelligence/ARCHITECTURE.md)

# Context Fabric + Temporal Event Bus (Prompt 04)

MapAble Context Fabric is the **perception layer**: one canonical, provenance-aware,
consent-aware representation of changing operational context. It is **not** global
participant surveillance and does **not** expand AI operational authority.

## Flow

```
Domain sources
  → Source Gate (provenance / auth / data class / consent)
  → Context Normaliser
  → Context Fabric store
  → selective Temporal Event Bus routing
       → Mission Runtime (query)
       → Recovery Engine (mission-linked events only)
       → audit / telemetry
```

## Canonical record — `MapAbleContextRecord`

Required provenance fields are never stripped: `sourceType`, `sourceRef`,
`sourceAuthority`, `observedAt`, `receivedAt`, `verificationStatus`, `evidenceRefs`,
`traceId`, plus `freshnessStatus`, `dataClasses`, `consentScopes`.

Bounded context types only (no diagnostic / psychological inferred-state).

## Temporal Event Bus — `MapAbleDomainEvent`

Typed, versioned, idempotent, provenance-aware domain events. This bus **feeds**
Prompt 03 `MapAbleMissionEvent` recovery ingestion when routing flags are on —
it does **not** replace mission events or CareOS `CloudEventOutbox`.

## Source trust

| Class | May be verified? |
|-------|------------------|
| `verified_system_record` | yes |
| `authenticated_provider_record` | yes |
| `public_authoritative_source` | yes |
| `participant_declared` | supported only |
| `model_inference` | **inference_only — never verified** |

Model inference cannot masquerade as system / provider records.

## Freshness

Deterministic **per context type**: `current` → `aging` → `stale` → `expired`.
Invalid observation timestamps yield `unknown`. **unknown ≠ missing.**

## Consent

Revocation redacts sensitive payloads while retaining audit/evidence refs.
Future `queryMissionContext` calls exclude revoked records.

## Feature flags (fail-closed)

| Flag | Default |
|------|---------|
| `MAPABLE_CONTEXT_FABRIC_ENABLED` | `false` |
| `MAPABLE_CONTEXT_EVENT_ROUTING_ENABLED` | `false` |
| `MAPABLE_CONTEXT_FABRIC_KILL_SWITCH` | `false` |

Requires `MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED` for HTTP surfaces.

## APIs (internal)

| Method | Path |
|--------|------|
| GET | `/api/ai/context/mission/:missionId` |
| POST | `/api/ai/context/events` |

Not public arbitrary-write endpoints. Session + rate limit + flags required.

## Persistence

In-memory store mirroring Prompts 01–03. **Not multi-instance durable.**
Durable outbox/context tables with retention/privacy require **Prompt 04A** —
do not weaken design or fake production durability claims.

## Module

`lib/ai/platform/context-fabric/` — types, schemas, registry, sources, normalise,
provenance, freshness, scope, query, events, routing, store, presentation,
mission-bridge, index.

## Accessibility

When provenance is exposed in My MapAble, surfaces include accessible source label,
observation date, verification state, why used, and a correction route (WCAG 2.2 AA).

## Authority

**None expanded.** Perception and selective routing only.

## Connector Gateway (Prompt 09)

External reads enter via the Governed Connector Gateway and return Context Fabric–compatible canonical records with provenance. Agents must not call externals directly. See [CONNECTOR_GATEWAY.md](./CONNECTOR_GATEWAY.md).

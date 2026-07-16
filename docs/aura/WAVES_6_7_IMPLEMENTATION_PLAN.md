# AURA Waves 6–7 Implementation Plan

## Waves 1–5 status (base branch)

| Wave | Status | Key modules |
|------|--------|-------------|
| 1 | Complete | CareOSMission, leases, proof plans, verifier, Taylor scenario |
| 2 | Complete | Counterfactual, resilience, Stop AURA, offline visit packs, audit replay |
| 3 | Complete | Immutable proposals, shadow evaluation, execution guard |
| 4 | Complete | Approved application-service execution, four-key, receipts, outbox |
| 5 | Complete | Participant Memory Cards, outcome calibration, evidence corrections |

Authority ceiling remains **L3_PROPOSE**; L4 only via approved execution architecture.

## Wave 6 — AURA Pocket (Checkpoint A)

### Prerequisites found

- No native iOS/Android app in repo — **web/PWA-compatible Pocket** implemented
- No service worker / IndexedDB — server-side snapshot store + client contracts documented
- Offline visit packs exist (Wave 2) — extended with Pocket mission snapshots
- Native bridge: **contract only** (`NATIVE_BRIDGE_CONTRACT.connected = false`)

### Implemented

- `lib/aura/pocket/` — capabilities, inference selector, snapshots, storage, sync, release gate
- `lib/aura/on-device-ai/` — simulator, browser noop, native bridge contract
- `lib/aura/multimodal/` — input envelope, media lifecycle, perception candidates
- `lib/aura/spatial/` — capture adapters, manual measurement
- `lib/aura/communication/` — semantic concepts, renderer, meaning hash
- APIs under `/api/intelligence/aura/pocket/*`, multimodal, perception, spatial, communication
- UI: `/dashboard/aura/pocket`, lens, communication
- Tests: `tests/aura/pocket`, `multimodal`, `spatial`, `communication`

### Wave 6 release gate

`evaluateWave6ReleaseGate()` — must pass before Wave 7. Set `MAPABLE_AURA_WAVE6_GATE_PASSED=true` for pilot.

## Wave 7 — Living Journey World Model (Checkpoint B)

### Implemented

- `lib/aura/world-model/` — composer, propagation, versioning
- `lib/aura/interoperability/` — source registry, GTFS schedule/realtime, IndoorGML, curb, SensorThings (read-only), WoT registry (actions disabled)
- `lib/aura/guardian/` — participant-controlled monitoring, alerts, proposal draft handoff
- APIs: world, guardian, admin interoperability stubs
- UI: mission world + guardian pages
- Tests: interoperability, world-model, sensors, guardian

### Permanent invariants

- `MAPABLE_AURA_WOT_ACTIONS_ENABLED=false`
- `MAPABLE_AURA_SENSORTHINGS_TASKING_ENABLED=false`
- `MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED=false`
- No live GTFS/sensor feeds connected by default — fixtures and shadow ingestion only

## Feature flags

See `.env.example` — all Wave 6–7 flags default **false**.

## Rollback

Disable flags per `docs/aura/ROLLBACK.md`. Participant snapshot deletion remains available.

## Pilot requirements before real data

1. Wave 6 gate pass in staging with real browser offline tests
2. Wave 7 gate pass with approved GTFS/sensor sources allowlisted
3. Threat model review for new ingestion endpoints
4. Accessibility audit (WCAG 2.2 AA) on Pocket UI

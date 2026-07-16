# Wave 7 Gap Report

**Branch inspected:** `cursor/mapable-aura-wave6-7-6ea8` → continued on `cursor/mapable-aura-wave7-10-6ea8`  
**Base:** Waves 1–6 + partial Wave 7 (`b23ca656`)

## Classification

| Requirement | Status | Action |
|-------------|--------|--------|
| Living Journey World Model types | complete | retain |
| World composer (Harbour fixture) | fixture-only | retain; document; no second model |
| Dependency propagation | partial | extend predictive hooks only via Wave 9 |
| Source registry | partial | retain in-memory; add admin API |
| GTFS Schedule | fixture-only | retain security helpers; no second importer |
| GTFS Realtime | stub | add shadow ingest + freshness enforcement |
| IndoorGML | fixture-only | retain XXE guards |
| Curb adapter | fixture-only | retain |
| SensorThings read-only | partial | retain; tasking stays disabled |
| WoT registry | partial | retain; actions stay disabled |
| Journey Guardian | partial | retain; wire Stop AURA; no auto-action |
| Admin interop APIs | missing | add |
| Prisma persistence | missing | defer (in-memory matches W1–5 default) |
| Appointment / station node types | partial | add missing node types |
| Wave 7 release gate | complete | strengthen checks |

## Duplicate domain risks

1. AI `journey/` Guardian vs AURA `lib/aura/guardian/` — AURA owns mission-bound monitoring; AI owns visit-plan recovery. Do not merge tables.
2. AI `reliability/` (evidence freshness) vs Wave 9 access-service uptime — separate domains.
3. AI `regional/` vs Wave 9 Regional Access Twin — compose AI aggregates; no new place tables.
4. AI `live/` BMS vs SensorThings — AURA observations remain separate read plane.

## Gate result (pre-gap-fill)

Wave 7 gate passes for fixture/simulator mode. Live feeds remain disabled by flag.

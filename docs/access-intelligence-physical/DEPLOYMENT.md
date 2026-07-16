# Deployment — Physical Systems

## Environment separation

| Env | Mode default | Live flag | Data |
|-----|--------------|-----------|------|
| Local / PR preview | `demo` | off | In-memory + Harbour fixtures |
| Staging | `shadow` or `supervised` | off | Synthetic or anonymised twin |
| Production pilot | `supervised` | off until checklist | Venue-scoped Prisma |
| Production live | `live` | **explicit enable** | Venue-scoped; hardware allowlisted |

Never share BMS credentials across demo and production.

## Feature flags

```bash
ACCESS_INTELLIGENCE_DEMO_MODE=true|false
ACCESS_INTELLIGENCE_PHYSICAL_MODE=demo|shadow|supervised|live
ACCESS_INTELLIGENCE_PHYSICAL_LIVE_ENABLED=true   # required for live; default unset/false
ACCESS_INTELLIGENCE_USE_PRISMA=true|false
ACCESS_INTELLIGENCE_PHYSICAL_SSE=true|false
ACCESS_INTELLIGENCE_BMS_URL=...                 # status read only unless roadmap done
```

**Live disabled by default:** if `PHYSICAL_LIVE_ENABLED` is not exactly enabling, requests for `live` mode must coerce to `supervised` or reject with clear error — never silent upgrade.

## Deploy steps (app)

1. Ship code with live flag off.
2. Run Prisma migrate for `ai_physical_*` (forward-only).
3. Smoke demo against Harbour Civic.
4. Enable shadow in staging; verify no adapter execute.
5. Supervised pilot with named approvers.
6. Live only after [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md).

Bind HTTP to `0.0.0.0:$PORT` on Render/other hosts (platform convention). Treat filesystem as ephemeral — persist actions in Postgres.

## Rollback

| Situation | Action |
|-----------|--------|
| Bad release (no hardware) | Revert deploy; demo/shadow unaffected |
| Dispatch anomalies | Set `ACCESS_INTELLIGENCE_PHYSICAL_LIVE_ENABLED=false` and mode=`supervised` or `shadow` |
| Kernel/regression | Disable physical API routes via flag; Core Access Intelligence remains up |
| Data migration issue | Restore DB from snapshot; halt migrate; keep live off |

RTO target for kill switch: ≤ 5 minutes ([SLOS.md](./SLOS.md)).

## Secrets

BMS tokens, adapter credentials, and AI keys only in env/secret manager. Never in twin JSON or client bundles.

## Related

[REAL_HARDWARE_ROADMAP.md](./REAL_HARDWARE_ROADMAP.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) · Core [PRODUCTION_ROADMAP.md](../access-intelligence/PRODUCTION_ROADMAP.md)

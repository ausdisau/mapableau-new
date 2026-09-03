# Hardening — P10 Readiness Matrix

## Flag matrix (default production posture)

| Capability | Flag | Default | GO posture |
|------------|------|---------|------------|
| Open infrastructure parent | `MAPABLE_OPEN_INFRASTRUCTURE_ENABLED` | false | CONDITIONAL GO |
| Panoramax | `MAPABLE_PANORAMAX_INTEGRATION_ENABLED` | false | CONDITIONAL GO |
| Community evidence | `MAPABLE_ACCESS_COMMUNITY_EVIDENCE_V1_ENABLED` | false | CONDITIONAL GO |
| Project Sidewalk | `MAPABLE_PROJECT_SIDEWALK_ENABLED` | false | CONDITIONAL GO |
| Access Quests | `MAPABLE_ACCESS_QUESTS_ENABLED` | false | GO (pilot) |
| Open311 | `MAPABLE_OPEN311_ENABLED` | false | CONDITIONAL GO |
| Accessible routing | `MAPABLE_ACCESSIBLE_ROUTING_ENABLED` | false | CONDITIONAL GO |
| Access missions | `MAPABLE_ACCESS_MISSIONS_ENABLED` | false | NO-GO (offline only) |
| SensorThings | `MAPABLE_SENSORTHINGS_ENABLED` | false | NO-GO |
| Public interop API | `MAPABLE_PUBLIC_ACCESS_INTEROP_API_ENABLED` | false | CONDITIONAL GO |
| Community graph | `MAPABLE_COMMUNITY_ACCESS_GRAPH_ENABLED` | false | CONDITIONAL GO |
| Agentic access | `MAPABLE_AGENTIC_ACCESS_ENABLED` | false | NO-GO |

## Legend

- **GO** — Safe for constrained pilot with monitoring
- **CONDITIONAL GO** — Pilot only with ops config, legal review, and explicit city/provider agreement
- **NO-GO** — Remain disabled until further hardening

## Blockers before production GO

1. Panoramax image tag pinned and `FS_URL` storage verified in pilot environment
2. Open311 city endpoint + legal clearance for civic data flow
3. R2 evidence store wired with moderation pipeline (foundation uses memory fallback)
4. Agentic tools require audit log integration before L2+ activation
5. SensorThings pilot needs temporal freshness policy sign-off

## Automated checks

Run `pnpm vitest run tests/access-open-infrastructure` before any flag activation review.

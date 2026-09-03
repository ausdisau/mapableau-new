# Feature Flags

All flags **fail closed**. Parent flag must be enabled first.

| Flag | Env var | Phase |
|------|---------|-------|
| Parent | `MAPABLE_OPEN_INFRASTRUCTURE_ENABLED` | P01 |
| Panoramax | `MAPABLE_PANORAMAX_INTEGRATION_ENABLED` | P01 |
| Community evidence | `MAPABLE_ACCESS_COMMUNITY_EVIDENCE_V1_ENABLED` | P02 |
| Project Sidewalk | `MAPABLE_PROJECT_SIDEWALK_ENABLED` | P02 |
| Access Quests | `MAPABLE_ACCESS_QUESTS_ENABLED` | P02 |
| Open311 | `MAPABLE_OPEN311_ENABLED` | P03 |
| Accessible routing | `MAPABLE_ACCESSIBLE_ROUTING_ENABLED` | P04 |
| Access missions | `MAPABLE_ACCESS_MISSIONS_ENABLED` | P05 |
| SensorThings | `MAPABLE_SENSORTHINGS_ENABLED` | P06 |
| Public interop API | `MAPABLE_PUBLIC_ACCESS_INTEROP_API_ENABLED` | P07 |
| Community graph | `MAPABLE_COMMUNITY_ACCESS_GRAPH_ENABLED` | P08 |
| Agentic access | `MAPABLE_AGENTIC_ACCESS_ENABLED` | P09 |

Implementation: `lib/integrations/access/flags.ts`

## Permanent denies (elsewhere in platform)

Do not enable: universal access scores, AI auto-publish, diagnosis inference, safety guarantees on routes or weather.

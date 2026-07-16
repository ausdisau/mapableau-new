# Life Event Taxonomy

**Registry:** `data/continuity-os/life-event-types.v1.json`  
**Loader:** `lib/continuity-os/taxonomy.ts`  
**Version:** 1.0.0 (effective 2026-07-16)

## Initial types

| typeKey | Category | Pilot |
|---------|----------|-------|
| `start_job` | EMPLOYMENT | Primary pilot |
| `leave_school` | EDUCATION | Template only |
| `hospital_to_home` | HEALTH_AND_SUPPORT | Clinical authority preserved |
| `move_house` | HOME_AND_COMMUNITY | Template only |
| `primary_carer_loss` | HEALTH_AND_SUPPORT | Minimise handover fields |

Templates never presume uniform steps. Participant (or valid authority) activates. Model may suggest type; must not silent-create.

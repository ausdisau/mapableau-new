# Branch and Schema Reconciliation (Waves 7–10)

## Branches

| Branch | Role |
|--------|------|
| `cursor/mapable-aura-wave4-5-6ea8` | Execution + memory |
| `cursor/mapable-aura-wave6-7-6ea8` | Pocket + Wave 7 foundation |
| `cursor/mapable-aura-wave7-10-6ea8` | This programme (gap-fill W7 + W8–10) |
| `cursor/access-intelligence-expansion-6ea8` | AI reliability/regional/missions — compose, don't fork |

## Canonical decisions

- CareOSMission / AURA mission store = mission SoT
- AccessPlace = place identity
- Access Passport = functional requirements
- ConsentRecord / AuditEvent = disclosure and audit
- Waves 3–5 proposals/execution = only write path
- Wave 10 Safety Kernel = only physical authority path (L5 supervised)

## Persistence

Waves 7–10 default to **in-memory stores** (consistent with AURA Waves 1–5). Prisma models for production persistence are deferred; no parallel editable operational tables.

## Migration ordering (future)

1. Existing Aura* W1–5 tables  
2. Optional AuraJourneyWorld / interop metadata  
3. Optional credential/capsule tables  
4. Optional reliability window tables  
5. Optional physical action tables  

Do not create duplicate JourneyGuardian or CoordinationMission tables.

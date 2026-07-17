# Participant Service Standard and What Changed Diff

**Maturity:** concept → scaffold (contracts + pure functions)  
**Public claim:** false  
**Persistence:** not yet Prisma — typed DTOs only in this wave  
**Flags:** `MAPABLE_SERVICE_STANDARD_ENABLED`, `MAPABLE_SERVICE_DIFF_ENABLED` (default false)

## Service Standard

Participant-controlled description of how services should be delivered.

- Distinguishes `hard_requirement` vs `preference`
- Versioned; field-level `shareWith`
- Effective dates; participant approval timestamp
- Delegates must use `delegate_with_authority` source (relationship ≠ authority)
- `diagnosisInferred` and `providerAuthoredSubstitute` are permanently `false`

Code: `lib/mission-portfolio/service-standard/`

## What Changed (Service Diff)

Deterministic comparison of prior vs proposed arrangements before participant acceptance.

Supported fields: worker, provider, vehicle, driver, venue, entrance, route, support time, agreement, price, equipment, communication acknowledgement, funding route.

Rules:

- Deterministic and text-first (`renderServiceChangeDiffText`)
- Auditable DTO (`authoritativeConclusions: false`)
- No model-generated authoritative conclusions

Code: `lib/mission-portfolio/service-diff/`

## Non-goals this wave

- No Prisma migration
- No public UI
- No AI summary treated as truth

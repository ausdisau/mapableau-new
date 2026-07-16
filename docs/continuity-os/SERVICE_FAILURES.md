# Service Failures

**Service:** `lib/continuity-os/failure.ts`, `lib/continuity-os/impact.ts`  
**API:** `POST /api/recovery/failures`

Signals include source classification. Forged/stale signals are rejected. Classification describes services/environment — never the participant. Severity ignores commercial tier.

Impact calculation preserves the prior plan (`priorPlanPreserved: true`) and requires participant review before consequential changes.

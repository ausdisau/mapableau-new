# Phase 32 — General availability (GA) decision

- `GeneralAvailabilityAssessment` is **advisory** by default. `advisoryOnly=true`.
- An executive `User` must sign it via
 `lib/production-readiness/executive-decision.recordExecutiveGaDecision`.
 - Decision text must be 40+ characters.
 - Executive user must exist and be a human (AI actors are refused by design).
- Env flags, passing tests, and continuous-assurance snapshots do **not**
 amount to GA. Only an executive-signed assessment can grant `active`
 tenant status via `activateTenant`.

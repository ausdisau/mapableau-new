# Pilot lifecycle

Statuses: `draft` → `pending_decision` → `approved` → `active` ↔ `paused` → `draining` / `terminated` → `closed`.

Stages (progressive): `design`, `readiness`, `sandbox`, `dry_run`, `shadow`, `limited_live`, `controlled_live`, `wind_down`, `closed`.

## Rules

- Transitions are enforced by `assertCanTransitionPilotStatus` / `assertCanAdvanceStage`.
- **Limited live / controlled live** require `limitedLiveEnabled` plus Wave 6 assessment string refs.
- Human decisions append `PilotDecisionRecord` — no AI auto-approval.
- **Pilot approval ≠ production approval.**

APIs: request-approval, approve, start, advance, pause, resume, terminate, complete (close).

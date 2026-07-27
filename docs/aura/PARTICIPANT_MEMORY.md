# AURA Wave 5 — Participant Memory & Calibration

Flag-gated Wave 5 slice under `lib/aura/{memory,calibration}/`. Full Agent OS (Pocket/Guardian/execution) remains deferred.

## Flags

| Flag | Default |
|---|---|
| `MAPABLE_AURA_MEMORY_ENABLED` | off |
| `MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED` | off |
| `MAPABLE_AURA_MEMORY_SUGGESTIONS_ENABLED` | off |
| `MAPABLE_AURA_EVIDENCE_CORRECTIONS_ENABLED` | off |

## Security

- Subject IDs (`userId` / `participantId`) are taken **only** from `requireApiSession()` / authorized session — never from query or body.
- Memory export and outcome/calibration writes require **server-side step-up MFA** (`x-mfa-assertion` bound to the authenticated user via `verifyRequestMfa`).
- Memory HTML export escapes `title` and `participantWording`.
- `recordOutcome` always compares `input.participantId` to `mission.participantId`, including `skipped: true`.
- Skipped outcomes are persisted in the calibration store.

## Routes

| Route | Auth |
|---|---|
| `GET/POST /api/intelligence/aura/memory` | Session |
| `GET /api/intelligence/aura/memory/export` | Session + MFA |
| `GET/POST /api/intelligence/aura/missions/[missionId]/outcome` | Session (+ MFA on write) |
| `GET/POST /api/intelligence/aura/missions/[missionId]/calibration` | Session (+ MFA on write) |

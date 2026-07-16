# AURA — STOP PROTOCOL (Wave 2)

Stop AURA is **mandatory** whenever `MAPABLE_AURA_ENABLED=true`. There is no optional flag to disable Stop.

## States

`not_stopped` → `stop_requested` → `stopping` → `stopped` (or `stop_failed_requires_review`)

Idempotent: duplicate stops return the same receipt.

## Effects

1. Mission marked stopped
2. AbortController aborts active generation
3. All AURA capability leases revoked
4. New tool calls / counterfactuals / pack creation blocked
5. Late results discarded (`discardIfStopped`)
6. Plans and audit history preserved
7. Stop Receipt created (no Passport / diagnosis content)
8. Offline packs labelled `mission_stopped`
9. Non-AI service links remain available

## API

`POST /api/intelligence/aura/missions/[missionId]/stop`

Does not require an active model session. No client-supplied authority level.

## UI

Visible text control “Stop AURA for this mission”, keyboard accessible, one confirmation, focus moves to stopped-state heading on success.

## Implementation

`lib/aura/stop/index.ts` — `executeStopAura`

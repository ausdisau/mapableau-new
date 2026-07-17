# AURA Wave 2 — Audit Replay

Structured, tamper-evident replay of what AURA did. **No hidden chain-of-thought.**

## Events

Witness store (`lib/aura/witness/index.ts`) records typed events with sequence, previous/current hash, actor, evidence and policy references, correlation ID.

## Verification

`verifyWitnessChain` → `AuraAuditVerification`

Tampering of `currentHash` fails verification. Historical AuditEvent rows are not rewritten; AURA maintains a versioned replay manifest referencing structured witness events.

## UI / API

- `/dashboard/aura/missions/[missionId]/audit`
- `GET .../audit` and `GET .../audit/verify`

## Flag

`MAPABLE_AURA_AUDIT_REPLAY_ENABLED`

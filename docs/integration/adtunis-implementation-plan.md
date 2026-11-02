# Adtunis Care vertical slice — implementation plan

## Goal

Participant-controlled Care messaging: authenticate → check permissions/consent → speech **or** text **or** AAC → editable candidate → explicit confirm → authorised delivery (or labelled simulation) → audit → recoverable failures. Voice is never mandatory.

## Workstreams

1. Discovery and ADR docs (`docs/integration/*`).
2. Packages: `adtunis-core`, `adtunis-asr`, `adtunis-aac`, `adtunis-ui`, `adtunis-mapable-sdk`.
3. App adapters `lib/adtunis/*` + routes `app/api/v1/adtunis/*`.
4. Care page `app/care/communicate`.
5. Prisma consent scopes + optional workspace JSON table.
6. Vitest safeguards + Care delivery tests; typecheck/lint.

## Feature flags / env (no secrets)

- `MAPABLE_ADTUNIS_ENABLED=false` (fail closed)
- `ADTUNIS_MESSAGING_MODE=mock|live` (default mock)
- `ADTUNIS_ASR_APPROVED`, `ADTUNIS_ASR_ENDPOINT`, `ADTUNIS_ASR_TOKEN` (server only)
- `ADTUNIS_SIMULATED_ASR=true` (dev/test mock recognition without private endpoint)
- Reuse `MAPABLE_AAC_COMMUNICATION_ENABLED` for passport phrases

## Out of scope

Production deploy, live cloud vendors, Clerk, Transport/Jobs auto-enable, merging into canonical MapAble without a separate change.

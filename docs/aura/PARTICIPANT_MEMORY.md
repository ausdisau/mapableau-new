# AURA Wave 5 — Participant Memory

Participant-owned memory is **off by default** and gated behind the Wave 4 release gate.

## Principles

- Only `participant_authored`, `participant_confirmed_suggestion`, or `imported_with_confirmation` sources
- Never `model_inferred`
- Never stored consent
- Canonical routing prevents duplicating Access Passport or AccessibilityProfile data

## Module

`lib/aura/memory/index.ts`

## APIs

- `GET/POST /api/intelligence/aura/memory`
- `GET /api/intelligence/aura/memory/export`

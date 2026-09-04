# Guardian — Processing and Privacy

**Assurance status:** `DESIGNED_CONTROL` / partial `IMPLEMENTED_CONTROL` (Phase 2 router).  
**Not** a claim of APP legal compliance.

## Purpose

Technical controls align processing decisions with APP-style obligations (collection notice, purpose limitation, overseas disclosure governance, security, access/correction pathways). Implementation ≠ legal compliance.

## Derived sensitivity

See `lib/ai/platform/guardian/processing-sensitivity.ts`. Highest `DataClass` in a payload wins. Classification uncertainty fails upward.

## Zones and defaults

| Sensitivity | Default zone / treatment |
|-------------|--------------------------|
| D0_PUBLIC | APPROVED_EXTERNAL allowed when processor approved |
| D1_INTERNAL | APPROVED_EXTERNAL for selected purposes only |
| D2_PERSONAL | MAPABLE_PRIVATE by default; external only with explicit policy + minimisation + consent |
| D3_SENSITIVE | DEVICE_EDGE or MAPABLE_PRIVATE only by default |
| D4_RESTRICTED | Deterministic / no general-purpose model by default |

## APP-oriented routing receipt

Each Guardian evaluation should record (audit refs, not raw payloads):

- purpose
- data classes + derived sensitivity
- processor / zone selected (or denial reason)
- authority decision ref / consent receipt refs when available
- minimum-necessary field list (when provided)
- policy version
- reason codes
- final decision

## Fail closed

Missing consent, revoked consent, cross-tenant scope, unapproved purpose, disabled flags, or uncertain routing → deny or human route. Callers cannot force `useCloudModel: true`.

## Direct marketing

Guardian-derived data must not be repurposed for direct marketing (APP 7). Purpose policy rejects marketing purposes.

## Overseas disclosure

APPROVED_EXTERNAL requires processor registry approval, residency/subprocessor metadata, and `MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED=true`.

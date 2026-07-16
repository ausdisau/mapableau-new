# Policy Language

RightsOS policy language is **deterministic and versioned**. Large language models may explain decisions to participants but never approve, deny, or mutate policy outcomes.

## Registry artefacts

| Artefact | Location | Versioning |
| -------- | -------- | ---------- |
| Purpose definitions | `data/rights-os/purposes.v1.json` | `RightsPurposeVersion` |
| Field definitions | `data/rights-os/fields.v1.json` | `RightsFieldDefinition` |
| Reason codes | `lib/rights-os/reason-codes.ts` | Code + message catalogue |

## Purpose schema (summary)

Each purpose defines:

- `allowedFields` / `prohibitedFields`
- `allowedOperations` (read, disclose, contact, …)
- `defaultDurationHours`, `onwardSharing`
- `participantReviewRequired`, `humanReviewRequired`
- `requiredDuties`, `affectedProgrammes`

## Vague purpose prohibition

Requests using prohibited vague codes (e.g. `improve_services`, `analytics`) are denied with `PURPOSE_VAGUE` unless explicitly registered.

## Reason codes

Reason codes are stable identifiers consumed by:

- `policy-evaluator.ts` — outcome computation
- `explain.ts` — participant-safe templates
- Audit metadata — `rights.policy_evaluated`

## Conflict rules

`conflict-engine.ts` detects:

- Employer diagnosis requests for adjustment purposes
- Supporter field conflicts
- Deletion vs active complaint
- Emergency context without registered purpose

Safe defaults: `deny`, `participant_review_required`, or `human_review_required`.

## AI boundary

See `lib/rights-os/ai-tools.ts` — tools may call `explainPolicyDecision` and prepare drafts only. `evaluatePolicy()` is never invoked from model tool execution paths in production.

## Related

- [PURPOSE_FIREWALL.md](./PURPOSE_FIREWALL.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

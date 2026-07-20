# Module — Positive Behaviour Support

**Positioning:** MapAble Positive Behaviour Support is a controlled-pilot, practitioner-led assessment, drafting, implementation and monitoring workspace.

**Maturity:** `controlled_pilot` · **publicClaimAllowed:** `false` · **externalModelEnabled:** `false`

## Scope

Guided questionnaire, engagement, assessment scaffolding, plan draft/version lifecycle, consultation/feedback, restrictive-practice checklist gate, implementation assignment views, reviews, deterministic AI assistance proposals, and accessible exports.

## Not in scope

- Autonomous plan generation or clinical determinations
- Approving, authorising, recommending, or activating restrictive practices via AI
- Automatic NDIS Commission or state/territory submission
- Substituting a suitable NDIS behaviour support practitioner
- Expanding ambient `case:read:any` for clinical PBS records

## Flags (server-only, default false)

| Flag | Purpose |
|------|---------|
| `MAPABLE_PBS_ENABLED` | Module gate |
| `MAPABLE_PBS_AI_ASSISTANCE_ENABLED` | Deterministic assistance |
| `MAPABLE_PBS_EXTERNAL_MODEL_ENABLED` | External model adapter (off) |
| `MAPABLE_PBS_RESTRICTIVE_PRACTICE_WORKFLOW_ENABLED` | RP checklist workflow |
| `MAPABLE_PBS_PRACTITIONER_FINALISATION_ENABLED` | Finalisation service |
| `MAPABLE_PBS_PUBLIC_CLAIM_ENABLED` | Must remain false in pilot |

## Routes

- Public: `/positive-behaviour-support`
- Participant: `/dashboard/positive-behaviour-support/**`
- Practitioner: `/practitioner/positive-behaviour-support/**`
- Provider: `/provider/positive-behaviour-support/assignments/[assignmentId]`
- Admin governance (metadata): `/admin/positive-behaviour-support`

## Owner

`lib/positive-behaviour-support/` — see also `docs/architecture/positive-behaviour-support-boundaries.md`.

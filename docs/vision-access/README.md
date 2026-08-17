# MapAble VisionAccessOS

**Product surface:** MapAble Access Lens  
**Platform layer:** VisionAccessOS — mobile visual accessibility intelligence, provisional measurement, hazard-candidate and evidence-capture for the MapAble ecosystem.

## Status (Wave 1)

Wave 1 delivers **shared contracts**, **taxonomy**, **feature flags**, **audit event names**, and a **synthetic Access Lens demo**.

| Capability | Wave 1 |
| ---------- | ------ |
| Real camera | No |
| Native modules | No |
| Model inference | No |
| Evidence upload | No |
| Canonical AccessPlace / Twin writes | No |
| Live advisory alerts | No |
| Measurement claims | No (measurement unavailable / provisional schemas only) |

## Primary rule

1. The camera produces **candidates**.
2. Depth sensors produce **estimates**.
3. Participants and authorised reviewers provide **context**.
4. Deterministic MapAble services **classify evidence**.
5. Verified claims require **appropriate human evidence**.

## Routes

| Path | Purpose |
| ---- | ------- |
| `/access-lens` | Product overview |
| `/access-lens/demo` | Synthetic fixture demo (list + decorative overlay) |

## Code map

| Path | Responsibility |
| ---- | -------------- |
| `lib/vision-access/` | Contracts, taxonomy, flags, state machine, fixtures |
| `types/vision-access.ts` | Public type re-exports |
| `components/access-lens/` | Accessible UI |
| `docs/vision-access/` | Architecture and current state |

## Related programmes (compose, do not fork)

- AccessPlace / AccessFloorPlan / indoor accessibility (on `main`)
- Access Lens product scaffold (PR #260) — absorbed/extended here
- AURA multimodal / Spatial Access Lens (unmerged) — adapter later
- Access Intelligence Living Access Twin / Passport (unmerged)
- AccessibilityOps, Civic Access, RightsOS, Personal Access Vault (unmerged)

## Safety copy

See `lib/vision-access/copy.ts`. Automated results must never be presented as certified measurements, legal assessments, navigation safety, or replacements for white cane / guide dog / O&M / professional assessment.

## Further docs

- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

Planned (not yet authored in Wave 1): `DEVICE_CAPABILITY_LADDER.md`, `HAZARD_TAXONOMY.md`, `PERCEPTION_PIPELINE.md`, `GEOMETRY_ENGINE.md`, `MODEL_REGISTRY.md`, `DATASET_GOVERNANCE.md`, `PRIVACY.md`, `BYSTANDER_PROTECTION.md`, `EVIDENCE_AND_PROVENANCE.md`, `MODERATION.md`, `LIVE_ASSISTANCE.md`, `ACCESSIBILITY.md`, `SAFETY_CASE.md`, `THREAT_MODEL.md`, `PILOT_RUNBOOK.md`, `ROLLBACK.md`.

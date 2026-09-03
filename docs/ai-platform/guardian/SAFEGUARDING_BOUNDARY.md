# Guardian — Safeguarding Boundary

**Authoritative gate:** `lib/ai/platform/policies/safeguarding-gate.ts`  
**Assurance status:** Existing gate is `IMPLEMENTED_CONTROL` / `TESTED_CONTROL`. Guardian wiring extends routing without raising AI authority.

## May

- Detect possible safeguarded workflow (cues / later model *signals*)
- Halt model-assisted operational progression
- Preserve participant-provided information
- Create human-review items
- Route toward canonical incident / complaint intake (Phase 4 adapters)
- Explain accessible next steps and emergency/human pathways

## Must not

- Determine whether abuse occurred
- Substantiate or dismiss allegations
- Decide statutory reportability (`aiMayDecideReportability = false`)
- Infer consent or decision-making capacity
- Authorise restrictive practices
- Close complaints or incidents
- Discipline or auto-suspend workers from model output alone

## Reportability language

Production SoR uses `possibleReportableIncident` on `IncidentReport`. Guardian may set `requiresHumanReportabilityAssessment = true` in decision metadata. It must **not** set an authoritative `isReportable = true`.

## Model signals

Safeguarding taxonomy uses `possible_*` labels only (e.g. `possible_boundary_violation`). Never `abuse_detected = true`. Provenance remains `model_inference`.

## CareOS alignment

See `docs/careos-safeguarding-boundaries.md`. Incident service remains canonical.

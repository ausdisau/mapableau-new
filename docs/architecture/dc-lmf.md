# Disability-Centric Logic & Memory Fabric (DC-LMF)

**Status:** designed control / implementation behind default-off feature flags.

DC-LMF is the shared person-context substrate for MapAble and synthetic Project Hope simulations. It does not replace identity, consent, authority, Trust Fabric receipts, AuditEvent, clinical state, or service-domain sources of truth.

## Core invariants

- Direct current self-report, including AAC-authored communication, outranks model inference.
- No response is unknown unless an explicit communication contract assigns meaning.
- Disability, dysarthria, AAC latency, movement difference, support dependence, distress, or atypical affect do not establish cognition, capacity, consent, quality of life, risk, or legal authority.
- Memory is contextual evidence. It cannot create consent, capacity, clinical indication, funding eligibility, legal authority, treatment limits, or organisational authority.
- Correction is append/supersede, not silent history rewriting.
- Projection is purpose-bound and minimum-necessary.
- Consent, delegation, disclosure receipts, and audit reuse existing MapAble Core services.
- Project Hope adapter accepts fictional/synthetic context only.

## V1 storage boundary

Inline persistence is allowed only for:
- public
- project_internal
- person_private

The following require a governed external/vault reference and may not be stored as raw DC-LMF JSON in v1:
- sensitive_personal
- health_related
- emergency_only
- local_only

This restriction is intentional until a reviewed encrypted/vault-backed storage integration exists.

## Feature flags

All default OFF:

- `MAPABLE_DC_LMF_ENABLED`
- `MAPABLE_DC_LMF_CARE_ENABLED`
- `MAPABLE_DC_LMF_PROJECT_HOPE_ENABLED`

`MAPABLE_TRUST_FABRIC_ENABLED` is also required because every disclosed projection must have a purpose-bound receipt.

## Initial APIs

- `GET /api/dc-lmf/memory` — participant reads their own memory ledger.
- `POST /api/dc-lmf/memory` — participant writes their own bounded memory record.
- `PATCH /api/dc-lmf/memory/:id` — participant corrects or contests a record.
- `DELETE /api/dc-lmf/memory/:id` — participant revokes a record from future use while preserving audit history.
- `POST /api/dc-lmf/projection` — self-only v1 projection endpoint.

Cross-user and organisation projections are internal adapters, so assignment, organisation, consent and authority checks remain in the owning service flow.

## Care adapter

`buildCareContextProjection()` requests only access, baseline, preference, procedural and correction categories under existing `care.accessibility_share` consent, capped at `person_private`.

## Project Hope adapter

`buildProjectHopeSyntheticContext()` is pure and database-independent. It rejects anything not marked:

```json
{
  "dataOrigin": "fictional_synthetic",
  "fictionalPatient": true
}
```

The returned context explicitly cannot alter clinical state, create consent, or infer capacity.

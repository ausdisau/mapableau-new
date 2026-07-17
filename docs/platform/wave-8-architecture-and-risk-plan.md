# MapAble NDIS Wave 8 — Architecture and Risk Plan

**Status:** Internal architecture and risk plan for Wave 8 (Governed Multi-Organisation Production Scale).
**Audience:** MapAble engineering, safety, privacy, security, and executive reviewers.
**Not for:** Regulator, NDIA, participant-facing communications.

## Non-negotiable disclaimers

- Wave 8 does **not** activate general availability (GA), production tenants, or real NDIA submission.
- Feature flags, environment variables, and code presence are **not** entitlements, GA approval, or evidence of assurance.
- AI must not approve onboarding, GA, regulatory interpretation, or break-glass.
- Waves 2–7 controls are **not weakened** by this wave. All existing fail-closed behaviours (privacy-safe claim storage, allowlist deny, controlled pilot gates, encryption of secrets, assurance evidence freshness) remain authoritative.
- MapAble does not hold SOC 2, ISO 27001, or NDIS digital platform certification. Anything in this plan that describes a control is design intent — not certification.
- No fabricated certifications, no fake attestations, no live production tenants.

## Phase 1 audit findings (what Wave 8 must fix)

Findings that block a defensible multi-organisation production posture (identified by reading the code prior to implementation):

1. **Silent platform-admin bypass in list scopes.**
 - `lib/api/phase3-scope.ts` returns `{}` (no filter) when the actor role `isAdminRole`. This means ambient platform admin traffic silently sees all organisations without break-glass, without an audit trail, and without an explicit organisation scope.
 - `lib/care/access-control.ts` mirrors the same pattern for participant-sensitive care access.
 - Wave 8 must make platform admin **fail closed** on cross-organisation reads unless there is an explicit `organisationId` scope or an active `BreakGlassSession`.

2. **Tenant model is a workspace, not a security boundary.**
 - `Tenant` / `TenantMembership` / `EnterpriseProviderWorkspace` / `GovernmentPartnerWorkspace` group workspaces but do **not** own participant, worker, funding, claim, or NDIS data. Making `Tenant.id` the security root would silently rewrite every organisation-scoped query in the codebase and is dangerous.
 - **Decision (LOCKED):** `Organisation.id` remains the authoritative security and accountability boundary. Wave 8 extends `Organisation` with tenant-lifecycle fields (tenant type, status, encryption profile, quotas, policies) rather than moving the boundary. `Tenant` remains optional grouping only.

3. **Feature flag ≠ entitlement.** Existing integration policy uses env vars (`STRIPE_ENABLED`, `NDIA_READINESS_ENABLED`, etc.) as the sole gate. Wave 8 introduces `TenantFeatureEntitlement` per organisation, plus a runtime gate that combines **entitlement AND flag AND assurance readiness AND GA decision** before enabling a feature for a tenant.

4. **Fail-closed integration list is too small.** `FAIL_CLOSED_INTEGRATION_KEYS` currently only lists `postgres` and `temporal`. Payment (`stripe`), accounting (`xero`), regulator sandbox (`ndia`), screening, encryption/KMS, and identity must also fail closed and be classified by criticality.

5. **No explicit break-glass audit path.** Platform admin actions that touch another tenant’s data need a `BreakGlassSession` record with reason, expiry, approver, and per-request audit.

6. **No production-readiness (GA) governance model.** There is no place to record “this tenant is not GA yet even if the code deploys.” Wave 8 introduces `GeneralAvailabilityAssessment` — an **advisory** record that an executive must sign off on. AI cannot approve.

7. **Vehicles / drivers reads unscoped in some paths.** Wave 8 tightens these to org-membership.

## Authoritative tenant boundary — LOCKED

- **`Organisation.id` is the tenant security boundary.**
 - Every row that carries participant data, worker data, funding data, or claim data continues to be scoped by `organisationId`.
 - Cross-organisation reads by platform admin require either an explicit `organisationId` scope, an active `BreakGlassSession`, or a documented federation/delegation record.
 - Parent/hub links (`parentOrganisationId`, `federationId`, `DelegatedTenantAuthority`) grant **narrow, opt-in** governance/reporting rights — they do **not** grant unrestricted data access.
- Existing `Tenant` / `TenantMembership` / `EnterpriseProviderWorkspace` / `GovernmentPartnerWorkspace` remain optional workspace grouping only. They are **not** used for security decisions.
- `Organisation.tenantKey` is a stable slug for logs/queues/paths so we can prefix external artefacts without leaking cuids.

## Data isolation posture

- **Default:** `shared_schema_strict` — a shared Postgres schema with mandatory `organisationId` scoping at the query layer.
- `dedicated_schema` / `dedicated_database` values are recorded as **intent** on the tenant. They are **not** implemented as live capabilities in this wave. The `TenantDataIsolationMode` enum records the current mode so we can honestly report to auditors what a tenant is on.
- **We do not claim active-active multi-region.** `dataRegion` defaults to `au`. Regional failover documents (`lib/resilience/regions/`) describe design intent — not a live capability.

## Security-critical refactors in this wave

- `lib/api/phase3-scope.ts` — remove silent admin bypass. Introduce `platformScopedWhere` that requires either an explicit `forceOrgIds` from a caller that has justified it, or an active break-glass session, otherwise returns `{ id: "__platform_unscoped_denied__" }` (never matches).
- `lib/care/access-control.ts` — same treatment for participant-sensitive operations.
- `lib/integrations/integration-feature-policy.ts` — expand `FAIL_CLOSED_INTEGRATION_KEYS` (payment, accounting, regulator sandbox, screening, KMS, identity) and add criticality classification.
- Vehicles / drivers list endpoints — scope by `getUserOrganisationIds`.

## Wave 8 components (design intent)

| Component | Purpose | Honest status |
|-----------|---------|---------------|
| Extended `Organisation` (tenant fields) | Tenant lifecycle on the security-authoritative model | Design + migration; no tenants are `active` GA. |
| `TenantStatusTransition` | Audit of every status change | Enforced. |
| `TenantEncryptionProfile` | Envelope encryption profile intent | Design; keys not created here. |
| `TenantFederation` + `FederationMembership` | Federation grouping | Design; no live data-sharing agreement. |
| `DelegatedTenantAuthority` | Narrow delegation grants | Design; approval workflow only. |
| `TenantOnboardingCase` | Onboarding workflow (no auto-activate) | Design. |
| `TenantPolicyProfile` | Per-tenant privacy/safety policy version | Design. |
| `RegulatorySource` + `RegulatoryChangeCase` | Regulatory change tracker | Design; nothing is authoritative regulator interpretation. |
| `TenantFeatureEntitlement` | Per-tenant feature grants | Design; enforced by runtime gate. |
| `ProductionRelease` + `ReleaseDeployment` | Rings model | Design; no automatic promotion. |
| `ServiceCatalogueEntry` | Internal catalogue | Design. |
| `TenantQuotaProfile` | Quota/backpressure policy | Design; enforced at runtime gate. |
| `TenantOperationalHealth` | SLO / error budget snapshot | Design. |
| `GeneralAvailabilityAssessment` | Advisory GA record | **Executive sign-off required. AI cannot approve.** |
| `BreakGlassSession` | Explicit cross-tenant elevation | Enforced. |
| `TenantModelClassification` | Data model classification registry | Design. |

## Risk register

- **Risk:** A future refactor treats `Tenant.id` as the security boundary. **Mitigation:** Locked ADR in this document; assertions in `lib/tenancy/tenant-assertions.ts`; audit script `tenancy:audit-ownership`.
- **Risk:** Platform admin regains ambient full-read via a helper other than `phase3-scope`. **Mitigation:** `platform-admin-policy.ts` central helper + `audit-admin-bypass` script.
- **Risk:** Feature flags are treated as GA. **Mitigation:** `runtime-gate.ts` requires entitlement AND flag AND assurance AND executive GA decision; disclaimers on all admin pages.
- **Risk:** Break-glass used routinely. **Mitigation:** `BreakGlassSession` requires reason, expiry, approver, and creates an `AuditEvent`. `cross-tenant-access-review.ts` documents periodic review.
- **Risk:** AI-authored regulator interpretation. **Mitigation:** `RegulatoryChangeCase` has explicit `humanReviewerId` and cannot be closed by an AI actor.

## What is NOT in this wave

- No live NDIA submission client (still Wave 5 deprecated).
- No production GA activation.
- No active-active multi-region.
- No cryptographic key custody claims — envelope encryption profile is intent, not proof.
- No SOC 2 / ISO 27001 / NDIS digital platform certification claims.

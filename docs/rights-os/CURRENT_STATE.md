# RightsOS Wave 0 — Current State Reconciliation

**Date:** 16 July 2026  
**Branch baseline:** `main` @ `fdd22bb3`

## Consent inventory

### Canonical API scopes (`lib/consent/scope-map.ts`)

| API scope | Prisma enum | Suggested Rights purpose |
|-----------|-------------|------------------------|
| `profile.read` | `profile_read` | `supporter.notify_change` |
| `accessibility.read` | `accessibility_read` | `access.share_visit_plan` |
| `booking.read` | `booking_read` | `care.coordinate_shift` |
| `booking.manage` | `booking_manage` | `care.coordinate_shift` |
| `messages.send` | `messages_send` | `supporter.notify_change` |
| `billing.read` | `billing_read` | `analytics.service_quality_aggregate` |
| `support_coordination.access` | `support_coordination_access` | `care.coordinate_shift` |
| `plan_manager.invoice_access` | `plan_manager_invoice_access` | `analytics.service_quality_aggregate` |
| `transport.accessibility_share` | `transport_accessibility_share` | `transport.driver_handover` |
| `transport.trip_access` | `transport_trip_access` | `transport.request_trip` |
| `care.accessibility_share` | `care_accessibility_share` | `care.worker_handover` |
| `support_profile.read` | `support_profile_read` | `care.worker_handover` |
| `engagement.read_delegate` | `engagement_read_delegate` | `supporter.notify_change` |
| `engagement.submit_delegate` | `engagement_submit_delegate` | `supporter.notify_change` |

### PRMS scopes to retire (`lib/prms/types.ts`)

| PRMS scope | Maps to Rights purpose | Retirement |
|------------|------------------------|------------|
| `profile_sharing` | `supporter.notify_change` | Dual-read via adapter |
| `transport_sharing` | `transport.driver_handover` | Dual-read via adapter |
| `plan_management` | `analytics.service_quality_aggregate` | Dual-read via adapter |
| `support_coordination` | `care.coordinate_shift` | Dual-read via adapter |
| `family_nominee_access` | `supporter.notify_change` | Dual-read via adapter |
| `medical_documents` | `human_review_required` | Never auto-map |
| `employment_adjustments` | `jobs.request_adjustment` | Dual-read via adapter |
| `billing_plan_manager` | `analytics.service_quality_aggregate` | Dual-read via adapter |
| `emergency_disclosure` | `human_review_required` | Never auto-map |
| `research_opt_in` | `research.approved_study` | Dual-read via adapter |

Adapter: `lib/rights-os/adapters/consent-record-adapter.ts`

## Audit action inventory (Rights-relevant subset)

| Action | Source | RightsOS use |
|--------|--------|--------------|
| `consent.granted` | consent-service | Ledger replay |
| `consent.revoked` | consent-service | Revocation correlation |
| `consent.share_blocked` | require-consent | Deny reason |
| `data_vault.requested` | vault-service | Rights request adapter |
| `rights.policy_evaluated` | shadow-logger | Ledger primary event |
| `rights.lease_issued` | capability-lease | Active access |
| `rights.lease_revoked` | capability-lease | Revocation |
| `rights.capsule_issued` | capsules | Disclosure record |
| `rights.capsule_verified` | capsules | Recipient access |
| `rights.duty_recorded` | duties | Recipient obligation |

## Branch merge plan

| Branch | Priority | Merge before |
|--------|----------|--------------|
| `origin/cursor/access-intelligence-module-4b25` | 1 | Wave 4 (AccessPassport, Trust Kernel) |
| `origin/agent/careos-national-platform` | 2 | Wave 7 (CareOSMission, AuthorityGrant) |
| `origin/agent/careos-identity-authority` | 3 | Wave 5 (delegate authority) |

**CareOS mission SoR conflict:** resolve `docs/merge-pending/mapable-intelligence-fabric/` before enforcing mission-bound purposes.

## Gaps closed by RightsOS

- Purpose registry with versioned definitions
- Field minimisation compiler
- Participant-readable Rights Ledger
- Supported Decision Room with visible dissent
- Access Capsules with non-wallet fallbacks
- Recipient duty receipts with honest attestation limits
- Unified feature flags (`MAPABLE_RIGHTSOS_*`)

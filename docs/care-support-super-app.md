# Care and support super-app

Dual-audience module for **participants** and **support coordinators** covering:

1. **Assessment of support needs** — structured intake with plan summary rollup
2. **Referrals to appropriate supports** — internal (care, transport, employment, provider finder) and external handoff
3. **Coordination of services** — timeline linking assessments, referrals, and existing Care MVP bookings

## Routes

### Participant (under Care hub)

| Route | Purpose |
|-------|---------|
| `/care/support` | Hub |
| `/care/support/assessment` | Multi-step assessment wizard |
| `/care/support/referrals` | Referral list |
| `/care/support/referrals/new` | Create referral |
| `/care/support/coordination` | Participant timeline |

### Coordinator

| Route | Purpose |
|-------|---------|
| `/support-coordinator` | Portal home |
| `/support-coordinator/participants` | Caseload |
| `/support-coordinator/participants/[id]` | Coordination hub + referral triage |
| `/support-coordinator/tasks` | Task inbox |
| `/support-coordinator/access` | Participant: approve coordinator access requests |

## APIs

- `GET/POST /api/care-support/assessments`
- `GET/PATCH /api/care-support/assessments/[id]` — submit (`status: submitted`), review (`status: reviewed`, coordinator)
- `GET/POST /api/care-support/referrals`
- `PATCH /api/care-support/referrals/[id]`
- `POST /api/care-support/referrals/[id]/create-care-request` — bridges to `CareRequest` draft
- `GET /api/support-coordinator/participants`
- `GET /api/support-coordinator/participants/[id]/coordination`
- `GET/PATCH /api/support-coordinator/tasks?taskId=`
- `GET/POST /api/support-coordinator/access-requests` — `?action=approve&requestId=`

## Database

- `support_needs_assessments`
- `support_referrals`
- `coordination_cases`
- Extends `CoordinatorTaskType` with `review_assessment`, `triage_referral`, `coordinate_services`

Migration: `prisma/migrations/20260526120000_care_support_super_app/`

## Consent

Coordinator access uses active `SupportCoordinatorRelationship`. Default scopes when `scopesJson` is empty:

- `care_support.assessment_share`
- `care_support.referral_manage`

Optional detail scope: `care_support.assessment_detail` (full `sectionsJson` for coordinators).

## Integration

- **Care MVP**: `create-care-request` creates a draft `CareRequest` and links `support_referrals.careRequestId`
- **Provider finder**: `internal_provider` referrals store `destinationJson.q` / `suburb` → `/provider-finder?...`
- **Plan Intelligence**: not in this module; `source: import_placeholder` reserved on assessments

## Tests

`tests/care-support-assessment.test.ts` — permissions, plan rollup, provider finder URL helper

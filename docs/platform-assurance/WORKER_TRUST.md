# Worker trust

## Gap report

`lib/worker-trust/gap-report.ts` maps `WorkerProfile` credential fields and `WorkerTrustCredential` rows into explicit display states:

- `verified_current`
- `verified_expiring`
- `expired`
- `check_pending`
- `check_unavailable`
- `disputed`
- `suspended`
- `prohibited`
- `not_required`
- `human_review_required`
- `not_provided`

**Hard rule:** only `verified_current` may be described as passed. `not_provided` without a live screening adapter becomes `check_unavailable`.

## This release

- No live NDIS Worker Screening Database integration
- No banning-order API
- Mock trust-passport credentials are flagged with `mock_trust_credential`

## UI

`/admin/platform-assurance/workers`

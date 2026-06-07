# NDIA production operations runbook (Tier 4)

## Claim submission failures

| Symptom | Action |
|---------|--------|
| `GOVERNANCE_APPROVAL_REQUIRED` | Record pilot approval; see [ndia-pilot-approval.md](./ndia-pilot-approval.md) |
| `NDIA_PILOT_DISABLED` | Set `NDIA_PILOT_ENABLED=true` only after governance sign-off |
| OAuth / 401 errors | Rotate credentials; check `NDIA_PROVIDER_TOKEN_URL` and clock skew |
| Validation errors | Fix claim payload; re-validate before resubmit |
| Rate limit | Back off; batch smaller exports |

Reference: [`lib/ndia/shared/ndia-errors.ts`](../../lib/ndia/shared/ndia-errors.ts)

## Status poll cadence

- Enable `NDIA_CLAIM_STATUS_POLL_ENABLED=true`
- Provider UI **Refresh status** or `GET /api/provider/ndia-claims/[claimId]/status`
- Stale claims (>14 days submitted, no status change): escalate to NDIA partner support

## Remittance reconciliation

1. Download remittance advice from NDIA/myplace.
2. Import CSV at `/provider/ndis-claims/reconciliation` or `POST /api/provider/ndia-remittance/import`.
3. Expected headers (flexible): `externalClaimId`, `amount`, `paymentDate`, `mapableClaimId`.
4. Matched claims update to `paid` automatically; review unmatched lines in import summary.

## Portal CSV fallback

When live API unavailable, batch export uses portal CSV (`PortalExportAdapter`). Follow [provider-claiming-sop.md](./provider-claiming-sop.md) myplace upload steps.

## Plan manager exports

- Billing-core plan-managed invoices: export via dashboard billing → plan manager JSON/email payload ([`lib/plan-manager/billing-export-bridge.ts`](../../lib/plan-manager/billing-export-bridge.ts))
- Legacy Y2 API export (`PLAN_MANAGER_INTEGRATION_ENABLED`) remains for pilot `Invoice` rows only

## Incident escalation

Follow launch-readiness item **INCIDENT_ESCALATION** and platform incident runbook. Disable `NDIA_REAL_SUBMISSION_ENABLED` to stop live HTTP while investigating.

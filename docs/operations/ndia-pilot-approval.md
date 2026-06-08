# NDIA pilot approval workflow

Human governance gate before any NDIA claim submit (mock or live).

## When required

- `NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL=true` (default)
- Enforced by [`lib/ndia/shared/governance.ts`](../../lib/ndia/shared/governance.ts) for invoice and batch API submits

## Recording approval

1. Admin completes NDIA readiness dry-run and evidence bundle review (`/admin/ndia-readiness`).
2. Admin records approval in NDIA pilot admin (`/admin/ndia-pilot`) — creates `NdiaPilotApprovalRecord` with `approved: true`.
3. Provider may submit claims (mock in Tier 1; sandbox HTTP in Tier 3).

## Live submit additional gates

When `NDIA_REAL_SUBMISSION_ENABLED=true` and `NDIA_PROVIDER_ADAPTER_MODE=http`:

- `NDIA_PILOT_ENABLED=true` must also be set
- Valid OAuth credentials configured
- Latest governance approval on file

## Revoking access

Delete or mark approval records inactive in admin pilot UI before disabling `NDIS_CLAIM_SUBMISSION_ENABLED` in production.

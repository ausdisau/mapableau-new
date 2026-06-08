# MapAble go-live operations

Phased checklist for production hosting through NDIA-connected provider operations. See tier env blocks in [`.env.example`](../../.env.example).

## Tier 0 — Platform hosting

### Exit criteria

- App on canonical domain with auth working
- `pnpm test` and `pnpm build` pass in CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml))
- Migrations applied on Neon production
- Launch readiness tracked at `/admin/launch-readiness`

### Required env

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection |
| `DIRECT_URL` | Neon direct (migrations) |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` | Auth |
| `NDIS_ENCRYPTION_KEY` | Encrypted NDIS numbers |
| `ADMIN_CRON_SECRET` | Bearer for `/api/admin/ingest/ndis-providers` cron |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | Password reset email |

### Cron auth

Vercel cron must send `Authorization: Bearer ${ADMIN_CRON_SECRET}` (see [`lib/admin/cron-auth.ts`](../../lib/admin/cron-auth.ts)). This is **not** the default `CRON_SECRET` name.

### Migrations (manual after deploy)

```bash
DIRECT_URL="postgresql://..." npx prisma migrate deploy
pnpm check:integrations-env
```

### Document storage

Set `DOCUMENT_STORAGE_BACKEND=supabase` or `s3` for multi-instance Vercel. Local filesystem is not suitable for production uploads.

### Flags — keep OFF at Tier 0

- `NDIA_REAL_SUBMISSION_ENABLED=false`
- `BILLING_ENABLE_STRIPE=false` until Tier 2 checklist complete
- `PLAN_MANAGER_INTEGRATION_ENABLED=false`
- `TRANSPORT_BOOKING_BRIDGE_ENABLED=false`

---

## Tier 1 — Operational provider (portal-assisted)

### Env

```env
NDIS_CLAIM_SUBMISSION_ENABLED=true
NDIA_READINESS_ENABLED=true
NDIA_PROVIDER_ADAPTER_MODE=mock
NDIA_REAL_SUBMISSION_ENABLED=false
NDIA_PARTICIPANT_API_ENABLED=false
```

### Provider workflow

1. Submit NDIS registration at `/provider/onboarding` (9-digit number)
2. Admin verifies at `/admin/organisations/[id]`
3. Build claims → validate → dry-run → mock submit
4. Export agency-managed batches as portal CSV → upload to myplace manually
5. Reconcile paid claims manually or via remittance CSV import

See [provider-claiming-sop.md](./provider-claiming-sop.md) and [ndia-pilot-approval.md](./ndia-pilot-approval.md).

---

## Tier 2 — Participant billing (Stripe)

See [billing.md](../billing.md) production checklist.

- Canonical webhook: **`POST /api/webhooks/stripe`** (legacy `/api/stripe/webhooks` forwards to the same processor)
- Payment reconciliation now includes **billing-core** invoices via [`lib/payment-reconciliation/billing-bridge.ts`](../../lib/payment-reconciliation/billing-bridge.ts)
- Xero export remains deferred (`not_implemented`)

---

## Tier 3 — NDIA sandbox

See [ndia-sandbox.md](./ndia-sandbox.md).

Governance gates (human approval + pilot flag) apply to **both** mock and live submit via [`lib/ndia/shared/governance.ts`](../../lib/ndia/shared/governance.ts).

---

## Tier 4 — NDIA production

See [ndia-operations-runbook.md](./ndia-operations-runbook.md).

- Remittance CSV import: `/provider/ndis-claims/reconciliation` or `POST /api/provider/ndia-remittance/import`
- Plan-manager export from billing-core uses [`lib/plan-manager/billing-export-bridge.ts`](../../lib/plan-manager/billing-export-bridge.ts) (single payload shape)

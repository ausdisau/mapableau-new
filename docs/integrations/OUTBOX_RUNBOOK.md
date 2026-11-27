# Integration outbox runbook (Phase 3a)

**Flags (default off / dry-run):**

```dotenv
MAPABLE_INTEGRATIONS_OUTBOX_ENABLED=false
MAPABLE_INTEGRATIONS_DRY_RUN=true
DEPUTY_ENABLED=false
XERO_DIRECT_ENABLED=false
STRIPE_DIRECT_BOOKING_ENABLED=false
```

## Stripe webhook fail-closed

- Handler errors must **not** mark `BillingStripeWebhookEvent.processed` / legacy `processedAt`.
- Livemode mismatch throws and leaves the event unprocessed (HTTP 500 → Stripe retry).
- Do not flip `STRIPE_DIRECT_BOOKING_ENABLED` without finance owner sign-off.

## Next PRs

- 3b Deputy draft unpublished shifts
- 3c Xero draft ACCREC
- 3d Care sandbox vertical slice

Constraints: [`docs/governance/asi-disability-care-constraints.md`](../governance/asi-disability-care-constraints.md)

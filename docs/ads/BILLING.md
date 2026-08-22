# MapAble Ads Billing

## Model

**Prepaid** advertiser balances. Stripe funds wallets; MapAble's append-only ledger handles high-frequency impression/click charges. Stripe is **not** charged per impression.

```text
Advertiser → Stripe Checkout → verified webhook → Ad Wallet credit
     → viewable impression / valid click → ledger debit
```

## Billable events

| Model | Bill when | Charge |
|-------|-----------|--------|
| CPM | Viewable impression | `clearingCpm / 1000` |
| CPC | Valid destination click | `clearingCpc` |
| HOUSE | Never | `0` |

Viewability (initial):

- Display: ≥50% visible for ≥1 continuous second
- Map marker: in viewport, map idle, visible ≥1 second

Idempotency:

- CPM: `impression:{impressionId}`
- CPC: `click:{clickId}` (at most one billable click per impression)

Client never submits clearing price, charge amount, or billable status.

## Atomic charge

`chargeAdvertiserWallet()` (server-only) transactionally:

1. Confirm never billed
2. Confirm campaign budgets
3. Confirm wallet balance
4. Create `AdBillingEvent`
5. Append ledger debit
6. Decrement wallet cache
7. Update campaign spend aggregates

No partial financial state; no negative wallet balance.

## Feature flags

- `MAPABLE_ADS_BILLING_ENABLED` (default false)
- `MAPABLE_ADS_STRIPE_TOPUPS_ENABLED` (default false)

Webhook reconciliation may settle when delivery is disabled.

## Tax / GST

Tax metadata is supported architecturally. **Do not** hard-code GST conclusions. Production enablement requires Australian accounting/tax review.

## Refunds & disputes

- Refund → compensating ledger debit (never rewrite `TOP_UP`)
- If refund would go negative → freeze wallet, pause paid campaigns, operator alert
- Dispute → freeze wallet by default, require admin review

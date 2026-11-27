# Care / finance sandbox vertical slice (Phase 3d)

Orchestrator: `lib/integrations/care-finance-sandbox-slice.ts`

```text
reviewed evidence + participant billing review
  -> MapAble draft invoice (SoT)
  -> Deputy unpublished draft (optional, DEPUTY_ENABLED)
  -> Xero ACCREC DRAFT (optional, XERO_DIRECT_ENABLED)
  -> private/self-managed: Stripe Checkout eligible only if STRIPE_DIRECT_BOOKING_ENABLED
  -> plan-managed: plan-manager export (no Checkout)
  -> agency-managed: out of scope for this slice
```

**Production claim:** `none`. Flags default off. No live charges, published rosters, or authorised Xero invoices.

Constraints: [`docs/governance/asi-disability-care-constraints.md`](../governance/asi-disability-care-constraints.md)

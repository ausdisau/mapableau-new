# Care finance vertical slice

**Flag:** `STRIPE_DIRECT_BOOKING_ENABLED=false` (default). Test/pilot only until owner signoff.

## Flow

1. Confirmed Care booking + eligible `workerProfileId` assignment
2. `IntegrationDelivery` → Deputy **unpublished** draft roster
3. Reviewed service evidence → MapAble `BillingInvoice` DRAFT
4. Xero ACCREC DRAFT (when `XERO_DIRECT_ENABLED` + org config)
5. Funding branch:
   - `ndis_plan_managed` / agency-managed → **no** Stripe Checkout
   - `ndis_self_managed` / private-pay → existing Stripe Checkout after human authorisation

## Compensating actions

Cancel / decline / change / no-show / dispute: update unpublished Deputy draft where mapped, hold draft invoices for review, notify authorised actors. **No** automatic blanket refund or worker removal.

## Accessibility

`CareFinanceStatusPanel` exposes keyboard-operable status, clear step states, retry, and human assistance — no automatic time-out of complex entry.

## API

`POST /api/integrations/care-finance/status` — dry orchestration status when the flag is on.

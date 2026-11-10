# Care payments: Google Pay / Apple Pay / card

MapAble care invoice payments use **Stripe** only. Do not install Google Play Services into apps; wallets are presented by Stripe Checkout (web) and PaymentSheet (mobile).

## APIs

| Surface | Endpoint | Notes |
| --- | --- | --- |
| Web | `POST /api/billing/checkout` | Hosted Checkout; omit `payment_method_types` so Dashboard dynamic PMs apply |
| Mobile | `POST /api/billing/payment-sheet` | Returns `customerId`, `ephemeralKey`, `paymentIntentClientSecret` |

Both respect funding gates in `lib/billing/core/funding-logic.ts`:

- Payable: `ndis_self_managed`, `private_card`, `private_pay`
- Not payable by wallet/card: `ndis_plan_managed` (export to plan manager), org/grant invoices

## Operator checklist

1. Stripe Dashboard → Payment methods: enable **Cards**, **Google Pay**, **Apple Pay** (AU).
2. Apple Developer: Merchant ID `merchant.com.ausdisau.mapable` + Apple Pay certificate uploaded to Stripe.
3. Restrict publishable keys; never put `STRIPE_SECRET_KEY` in mobile, Wix, or Firebase client config.
4. Test mode first (`EXPO_PUBLIC_STRIPE_TEST_MODE=true` / test keys).
5. Production Google Pay requires a **signed release** build and Stripe production approval.
6. Confirm webhooks: `payment_intent.succeeded` updates `BillingPayment` / invoice (`lib/billing/core/webhook-handler.ts`).

## Mobile

- Expo plugin `@stripe/stripe-react-native` with `enableGooglePay` + `merchantIdentifier`.
- **EAS / `expo run:*` development build required** — Expo Go cannot run Google Pay or Apple Pay.
- Env: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_MAPABLE_API_URL`, session Bearer token for payment-sheet.

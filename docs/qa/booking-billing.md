# Booking & billing QA

Manual and automated checks for participant/provider booking flows and the billing centre.

## Automated tests

```bash
pnpm exec vitest run tests/booking-billing-ui-patterns.test.tsx
```

Related backend coverage:

- `tests/mapable-core.test.ts` — booking create schema
- `tests/billing-core.test.ts` — invoice totals, checkout rules, webhooks

## Participant booking wizard

1. Login as a participant test user (`participant@mapable.test` after seed).
2. Open `/dashboard/bookings/new`.
3. **Step navigation:** Tab through the step list; confirm the active step uses clear emphasis and screen readers announce “Step N of 5”.
4. **Validation:** On step 2, click **Next** without a start datetime — confirm an inline error appears and you cannot advance.
5. **Review:** On the final step, confirm booking type shows human labels (not raw enums like `care_transport`).
6. **Consent:** Step 4 links to `/dashboard/consent` and uses a labelled checkbox.
7. Submit a valid request — confirm redirect to `/dashboard/bookings/[id]`.
8. **Nav:** From a booking detail URL, confirm **Bookings** remains highlighted in dashboard nav.

## Provider booking response

1. Login as `provider@mapable.test`.
2. Open `/provider/bookings` — empty state or list with readable booking types and datetimes.
3. Open an assigned pending booking.
4. **Accept:** Add an optional note, accept — success message appears; status updates after refresh.
5. **Decline:** Click decline — confirmation dialog appears (not a browser prompt). Cancel, then confirm decline — success message appears.
6. Simulate offline/API failure (disable network in devtools) — error message is announced.

## Billing centre (participant)

1. Open `/dashboard/billing/funding/new`.
2. Submit with empty label — field error appears.
3. Choose **NDIS plan-managed**, enter invalid plan manager email — inline validation error.
4. Save a valid funding source — redirect to detail page.
5. Open `/dashboard/billing/invoices`.
6. **Per-invoice actions:** Start checkout/export on one invoice — other invoice buttons remain enabled.
7. Complete or cancel Stripe checkout — return message appears once; refreshing the page does not repeat the message (query params stripped).
8. Open an invoice detail page.
9. **Dispute:** Open dispute dialog, submit with fewer than 10 characters — validation error; submit valid reason — success message.

## Provider billing

1. Open `/provider/billing`.
2. Start Connect onboarding — button shows loading state; errors appear in a status banner if Stripe is not configured.
3. Start Provider Pro subscription checkout — subscription button loading does not disable Connect button (separate busy states).

## WCAG spot-check (booking + billing)

| Check | Where to verify |
| ----- | ---------------- |
| Touch targets ≥ 44px | Booking wizard radios, billing buttons (`min-h-11`) |
| Visible focus | Tab through dashboard nav, invoice action buttons |
| Form labels | Funding form fields, provider response note |
| Error announcement | Wizard validation, dispute dialog, invoice fetch failures |
| Live regions | Step changes, checkout return messages, status banners |
| Dialog semantics | Decline booking, dispute invoice (`role="dialog"`, labelled heading) |

See also [docs/billing.md](../billing.md) for billing architecture and NDIS routing rules.

## Related QA

- [Phase 3 QA](./phase-3.md) — care, transport, jobs, calendar flows
- [Bookings module](../modules/bookings.md) — unified booking wizard specification

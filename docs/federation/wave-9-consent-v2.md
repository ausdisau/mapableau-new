# Wave 9 — Consent v2 (`ConsentDirective`)

Status: Wave 9. Non-regulator; amber disclaimer applies.

## Why v2

Wave 2 shipped `ConsentRecord` + `checkConsent`. The audit for Wave 9 found:

1. `checkConsent` returned `true` for any active record when the caller
   omitted both `grantedToUserId` and `grantedToOrganisationId`. Fixed to
   fail closed in `lib/consent/consent-service.ts`.
2. Revocation was destructive. A revoked record could not be distinguished
   from one that had never existed. Wave 9 fixes this with an append-only
   `ConsentDirective` history and `ConsentReceipt` hash chain.
3. Purpose was a free-text string with no vocabulary. Wave 9 introduces a
   `ConsentPurpose` enum plus a mandatory `purposeDetail` narrative.
4. Recipient identity relied on `Organisation.id`. Wave 9 adds a
   `ConsentRecipientCategory` enum and an `ExternalFederationEntity` for
   third-party verifiers that are not MapAble tenants.

## Directive lifecycle

`granted → active → withdrawn` (or `expired`). A directive can only
transition by creating a **new version** that supersedes the previous one.
The `supersedesId` back-link builds a history graph, never a mutation.

## Boolean projection

`checkConsentBooleanProjection(input)` (in `lib/consent-v2/compat.ts`) reduces
a directive verdict to a boolean for callers still on the Wave 2 API. It
fails closed when the directive denies or when the input is ambiguous.

## Files

- `lib/consent-v2/directives.ts` — write + query
- `lib/consent-v2/evaluation.ts` — rich verdict (`evaluateConsentDirective`)
- `lib/consent-v2/receipts.ts` — hash-chained receipts
- `lib/consent-v2/usage.ts` — `ConsentUseEvent` audit trail
- `lib/consent-v2/revocation.ts` — withdraw = new version
- `lib/consent-v2/compat.ts` — boolean projection

## AI boundary

AI cannot grant, sign or override consent. It may only *evaluate* verdicts
and *suggest* directives that a participant then approves.

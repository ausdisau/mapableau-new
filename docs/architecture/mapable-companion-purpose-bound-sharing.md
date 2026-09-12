# MapAble Companion — purpose-bound support-plan sharing governance

**Status:** In development; prepared-only local envelope, no transmission  
**Scope:** participant-authored support-plan sharing preparation  
**Dependency:** PR #581 participant-authored support planning and existing MapAble Core consent services

## Decision

MapAble may help a participant prepare the exact information they may want to share with a chosen person, MapAble human, or external service. Preparing that information is not consent to transmit it and is not evidence that any recipient has received or accepted it.

This slice is deliberately limited to a local, browser-memory sharing envelope. It does not persist the participant-authored text, create a `ConsentRecord`, contact a recipient, or perform network transmission.

## Why this uses MapAble Core rather than a second consent system

The repository already has shared consent infrastructure in `lib/consent/consent-service.ts` and `lib/consent/consent-receipt-service.ts` supporting purpose, recipient, expiry, data scope, receipts and revocation.

The Companion must not create a parallel consent authority for sensitive support-plan information. A later sending workflow must adapt the participant's prepared envelope into the existing Core consent and audit model before any governed disclosure occurs.

## Prepared envelope contract

A valid prepared envelope is bound to:

- one explicit recipient kind and participant-entered recipient label;
- one allow-listed purpose;
- only support-plan fields already selected by the participant for the private preview;
- a finite expiry preset;
- a unique local envelope identifier.

Current recipient kinds:

- `chosen_person`;
- `mapable_human`;
- `external_service`.

Current purposes:

- `ask_for_support`;
- `coordinate_follow_up`;
- `share_communication_access`.

Current expiry presets:

- one hour;
- one day;
- seven days.

The prepared object must remain explicit that:

- `deliveryState = NOT_SENT`;
- `sent = false`;
- `transmissionAuthorised = false`;
- `externalAcceptanceConfirmed = false`;
- `consentRecordId = null`.

## State model

Current v1 states are intentionally small:

`PREPARED -> EXPIRED`

or

`PREPARED -> REVOKED`

Neither state performs transmission.

A future governed transmission workflow should use distinct states such as:

`PREPARED -> TRANSMISSION_CONFIRMATION_REQUIRED -> CORE_CONSENT_GRANTED -> SENDING -> DELIVERED`

`EXTERNAL_ACCEPTED` may occur only after an external recipient or service explicitly confirms connection or acceptance. `DELIVERED` is not equivalent to `EXTERNAL_ACCEPTED`.

## Consent boundary

The following actions are separate and must never be collapsed:

1. writing information in the support plan;
2. selecting a field for the private preview;
3. preparing a recipient/purpose/expiry envelope;
4. explicitly authorising transmission;
5. creating or using the appropriate Core consent record;
6. sending the selected information;
7. confirming delivery;
8. confirming external acceptance, if applicable.

Distress, silence, delayed response, AAC use, communication disability, family involvement or prior sharing do not imply any later step.

## Revocation and expiry

Before transmission, expiry or revocation blocks future use of the local prepared envelope.

Revocation must not be described as deleting or recalling information from an external recipient. If a future workflow has already transmitted information, revoking future consent cannot truthfully guarantee that an external recipient has erased information already received. Any later transmission design must explain that limitation before sending.

## Data minimisation and privacy

Current implementation keeps the support plan, preview and prepared envelope in local React component state. It does not introduce a database model or API endpoint for the envelope.

Do not place participant-authored crisis/support-plan text into advertising, marketing, engagement optimisation or ordinary analytics streams.

A future transmission implementation must record only the audit metadata necessary to prove the participant's decision and disclosure event. It should avoid duplicating the full sensitive narrative into generic audit logs.

## Accessibility and supported decision-making

The sharing step must remain usable with:

- keyboard and screen reader navigation;
- switch and eye-gaze workflows;
- AAC and typed communication;
- large stable targets;
- plain-language labels;
- no time pressure imposed by the interface;
- a clear ability to change recipient, purpose, expiry or selected fields before authorising any transmission;
- human assistance when requested without transferring decision authority away from the participant.

Communication disability is not evidence of incapacity. A supporter may assist with communication or understanding only within the participant's chosen and lawful authority arrangements.

## Failure and safety behaviour

- Missing recipient: do not prepare the envelope.
- Empty selected summary: do not prepare the envelope.
- Participant changes the plan or selected preview: invalidate the currently prepared envelope.
- Expired envelope: do not permit future transmission from it.
- Revoked envelope: do not permit future transmission from it.
- Network unavailable: irrelevant to this slice because preparation is local and does not send.
- Recipient cannot be verified in a future sending flow: stop before transmission and require participant review/human assistance.

## TDD evidence

The initial #582 RED commit contained the sharing-envelope tests without an implementation. GitHub Actions Quality failed at TypeScript resolution with `TS2307` because `@/lib/ask-mapable/purpose-bound-sharing` did not yet exist.

After the implementation was added, the feature-specific tests passed in the Quality workflow, including:

- exact recipient/purpose/expiry preparation;
- selected-field-only disclosure;
- missing-recipient rejection;
- finite expiry;
- revocation without recall/deletion claims;
- prepared envelope invalidation when the participant changes the preview;
- no send action or external-acceptance inference.

Repository-wide Quality, CI and Security remain red because of inherited failures outside this slice. This document does not claim the branch is merge-ready or production-ready.

## Ethical decision

**ALLOW_WITH_SAFEGUARDS** for prepared-only, participant-controlled local sharing envelopes.

Actual external transmission remains a separate governed capability. Before implementation it requires an explicit participant confirmation step, verified recipient handling, integration with MapAble Core consent/receipts/audit, delivery-state evidence, accessible cancellation/error handling, and privacy review.

## Next implementation gate

Do not add a `Send` action until the next design explicitly answers:

1. how the recipient identity is verified;
2. which existing `ConsentScope`, `ConsentRecipientType` and share mode apply;
3. how exact selected fields become `dataScope` without broadening them;
4. how expiry and revocation are enforced server-side;
5. what audit record proves consent without copying unnecessary sensitive text;
6. how delivery is distinguished from external acceptance;
7. what happens if consent creation succeeds but transmission fails;
8. how a participant can review/cancel using AAC, keyboard, screen reader, switch or eye-gaze access;
9. how emergency exceptions, if ever required, remain narrow, lawful, necessary and human governed.

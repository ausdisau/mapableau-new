# Rights, consent, and audit

**Modules:** [`rights/action-policy.ts`](../../lib/access-intelligence/rights/action-policy.ts), [`audit.ts`](../../lib/access-intelligence/audit.ts). Approval UI: [`approval-card.tsx`](../../components/access-intelligence/approval-card.tsx).

## Sensitive actions (approval required)

- requestVenueVerification
- submitBarrierReport
- shareAccessPassport / shareVisitPlan

Before execute, show recipient, purpose, exact fields/questions, duration, Approve / Cancel. Cancel records audit outcome `cancelled` and performs **no write**.

## Policy decision

`ActionPolicyDecision`: allowed, approvalRequired, reasons, fieldsPermitted / fieldsDenied. Revoked consent is rejected.

## Audit event (minimum)

actor · action · purpose · recipient · fields shared · timestamp · outcome · optional metadata (no raw health notes / full chat transcripts)

## Persistence note

Consent grants currently use an in-memory store suitable for demo; Living Building ops persistence is separate (`getLivingPersistence`). Production should map grants to durable tables.

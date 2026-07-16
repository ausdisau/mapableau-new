# MapAble Trust Kernel

Executable rights, consent, approval, and audit rules — not blockchain.

**Code:** `lib/access-intelligence/rights/action-policy.ts`, `audit.ts`, ApprovalCard UI.

## Sensitive actions

requestVenueVerification · submitBarrierReport · shareAccessPassport · shareVisitPlan · (future: research enrolment)

## Rules

- Field-specific, recipient-specific, purpose-specific, revocable  
- Cancelled approval → no external write  
- Revoked/expired consent → action rejected  
- Do not log full passports, health notes, or chat transcripts  

See also RIGHTS_CONSENT_AND_AUDIT.md and PRIVACY_AND_CONSENT.md.

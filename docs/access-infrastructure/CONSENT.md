# Access consent & disclosure

**Status:** uses existing consent + trust-fabric receipts (no new DisclosurePolicy table in this slice)  
**Public claim:** none

## Policy model (this slice)

| Concept | Implementation |
| --- | --- |
| DisclosurePolicy | `AccessPassport.visibilityDefault` + per-requirement `disclosureScopes` |
| DisclosureReceipt | `recordDisclosureReceipt` in `lib/trust/fabric/receipt-service.ts` when sharing occurs |
| Consent | Existing `ConsentRecord` / `lib/consent/` |

Cross-vertical access does **not** imply cross-vertical disclosure. Revocation must fail closed for previously authorised scopes.

## Privacy rules

- `GET/PATCH /api/access-infrastructure/passport` is owner-only.
- Public place capability responses must never include Access Passport fields.
- Care / Jobs / Transport must not read each other's purpose-bound access data without fresh consent.

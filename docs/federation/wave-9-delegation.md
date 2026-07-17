# Wave 9 — Delegation (`DelegateAuthority`)

Status: Wave 9. Amber disclaimer applies.

## Principle: relationship ≠ authority

A person who is listed as a family member, emergency contact, plan manager
contact, support coordinator or advocate has a *relationship* with the
participant. That alone does **not** confer authority to:

- View or download participant data
- Approve credential issuance or presentation
- Manage billing, invoices or plan spend
- Withdraw or grant consent on the participant's behalf
- Act on emergency access requests

Authority is a separate, explicit record: a `DelegateAuthority` with
categories (`view_data`, `billing_manage`, `legal_representation`,
`emergency_action`, `plan_manage`) and a `verification` level.

## Verification matrix

| Category                 | Minimum verification                |
|--------------------------|-------------------------------------|
| `view_data`              | `participant_confirmed`             |
| `plan_manage`            | `platform_verified`                 |
| `billing_manage`         | `platform_verified`                 |
| `emergency_action`       | `platform_verified` + time-bounded  |
| `legal_representation`   | `legal_instrument_verified`         |

## Invariants

- `delegateId != participantId` (no self-delegation)
- Every activation writes a `DelegateAuthorityTransaction` audit row
- Revocation creates a `revoked` transaction; the row is not deleted
- AI cannot approve, escalate or revoke authority; a human actor must sign

## Files

- `lib/delegation/authority.ts`
- `lib/delegation/relationships.ts`
- `lib/delegation/verification.ts`
- `lib/delegation/transactions.ts`
- `lib/delegation/revocation.ts`

## Threat model

See `docs/security/delegation-threat-model.md`.

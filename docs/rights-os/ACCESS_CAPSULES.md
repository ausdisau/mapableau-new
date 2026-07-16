# Access Capsules

Access Capsules are time-limited, purpose-bound disclosure packages. They let participants share only what is needed for a specific visit, trip, or handover — without handing over a full Access Passport or health record.

## Presentation methods

| Method | When to use |
| ------ | ----------- |
| `secure_link` | Default; single-use or short-lived URL with hashed token |
| `qr_code` | In-person handover when the recipient has a scanner |
| `printable_card` | Low-tech fallback; minimal fields only |
| `phone_verification` | Staff-assisted verification with callback code |

## Security controls

- **Field manifest only:** Capsules disclose named fields from a policy decision — never raw vault ciphertext.
- **Replay protection:** Verification increments a nonce; reused tokens are rejected.
- **Expiry:** Default aligned to purpose `defaultDurationHours`; participant may shorten.
- **Supervised enforcement:** Capsule issuance requires `MAPABLE_RIGHTSOS_MODE=supervised` or `production` plus participant approval.

## Models

- `AccessCapsule` — purpose, fields, token hash, expiry, status
- `CapsuleVerification` — verification attempts and outcomes
- `RecipientObligation` — duties attached to the capsule

## API

- `GET/POST /api/rights/capsules`
- `GET /api/rights/capsules/[capsuleId]`

## Feature flag

`MAPABLE_ACCESS_CAPSULES_ENABLED=true`

## Scenarios A & B (pilot)

**A — Venue:** Harbour Civic Centre receives arrival time and entrance preference only; diagnosis and full passport denied.

**B — Transport:** Driver handover includes pickup point and equipment dimensions; medical history denied; onward sharing prohibited.

## Related

- [PURPOSE_FIREWALL.md](./PURPOSE_FIREWALL.md)
- [RECIPIENT_OBLIGATIONS.md](./RECIPIENT_OBLIGATIONS.md)

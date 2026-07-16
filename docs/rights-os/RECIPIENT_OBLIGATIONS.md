# Recipient Obligations

Recipient Obligations define what a data recipient must do after receiving a capability lease or access capsule. They are **duties**, not guarantees of compliance — verification and attestation limits are stated honestly in the UI.

## Duty catalogue

| Code | Meaning |
| ---- | ------- |
| `use_only_for_purpose` | Use data only for the registered purpose |
| `delete_after_use` | Delete local copies after the stated event |
| `no_onward_share` | Do not share with third parties |
| `no_marketing` | Do not use for marketing or profiling |

## Honest attestation limits

MapAble **cannot** verify that a recipient deleted data on their own systems. The platform records:

- Duty assignment at lease/capsule issuance
- Recipient attestation when submitted (`RecipientDutyReceipt`)
- Overdue status when attestation is missing past deadline

UI copy must say **"attestation recorded"**, not **"deletion verified"**.

## Models

- `RecipientObligation` — duty code, deadline, status
- `RecipientDutyReceipt` — attestation type (`confirmed`, `partial`, `unable`)

## API

- `GET/POST /api/rights/duties`

## Feature flag

`MAPABLE_RECIPIENT_DUTIES_ENABLED=true`

## Scenario E (pilot)

After a venue capsule expires, the venue submits an attestation that arrival assistance data was deleted from their local roster. MapAble records the attestation; the participant sees "attestation recorded" in Rights history.

## Related

- [ACCESS_CAPSULES.md](./ACCESS_CAPSULES.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)

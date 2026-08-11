# Consent and disclosure

**Status:** Access Infrastructure disclosure policies + receipts (compose with existing ConsentRecord / Trust Fabric)

## Principles

- Never infer consent from profile existence
- Attribute-level (or meaningful grouped) disclosure
- Purpose limitation per recipient role
- Expiry and revocation
- Audit without free-text health notes

## Models

- `AccessDisclosurePolicyRecord` — what may be shared with a recipient role/purpose
- `AccessDisclosureReceiptRecord` — what was actually shared
- Existing `ConsentRecord` / Trust Fabric receipts remain the platform consent spine

## Recipient roles

`care_worker` · `care_provider` · `transport_operator` · `driver` · `employer` · `workplace_contact` · `support_coordinator` · `delegate` · `emergency` · `venue` · `other`

## Firewall examples

| Recipient | May receive (if authorised) | Must not receive by default |
| --- | --- | --- |
| Transport operator / driver | Mobility aid, boarding, restraint, pickup instructions, communication preference | Diagnosis, NDIS budget, medication, employment history, care notes |
| Employer | Authorised workplace adjustments only | Diagnosis, NDIS status, personal-care, medication, support-worker notes |
| Care worker | Shift-relevant support and communication | Jobs disclosure bundle, unrelated transport history |

## API

`POST /api/access-infrastructure/disclosures` with `action`: `preview` | `confirm` | `revoke` | `upsert_policy`

Confirm only returns **permitted** attributes — denied keys are never leaked in the receipt payload.

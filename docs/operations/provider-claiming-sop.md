# Provider claiming standard operating procedure (Tier 1)

Portal-assisted agency-managed claiming without live NDIA API.

## Prerequisites

1. **NDIA registration** — provider submits 9-digit registration number at `/provider/onboarding`; MapAble admin verifies at `/admin/organisations/[id]`.
2. **myID + RAM** — organisation delegates must use myID and Relationship Authorisation Manager (RAM) for myplace portal access ([NDIA guidance](https://www.ndis.gov.au/providers/working-provider/connecting-ndia-systems)).
3. **Participant NDIS numbers** — stored encrypted on participant profiles for claim validation.

## End-to-end flow

1. Deliver services and record delivery evidence (service logs / bookings).
2. Create claim draft from invoice (`/provider/ndia-claims`) or booking claim lines (`/provider/claiming`).
3. Run **Validate** then **Dry run** (no NDIA HTTP in Tier 1).
4. **Submit** records a mock external reference (`ndia_mock_*`) for audit.
5. For batch agency-managed lines: **Export batch** → download portal CSV.
6. Log in to **myplace provider portal** and upload CSV manually.
7. After NDIA payment: mark claims paid in reconciliation UI or import remittance CSV.

## Governance

When `NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL=true`, an admin must record pilot approval before submit (see [ndia-pilot-approval.md](./ndia-pilot-approval.md)).

## Not in scope (Tier 1)

- Live NDIA OAuth submit
- Automated myplace upload
- Participant/plan NDIA API verification (`NDIA_PARTICIPANT_API_ENABLED` must stay `false`)

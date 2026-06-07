# Registered provider NDIA claiming

MapAble Core module for **registered NDIS providers** to build and submit claims to NDIA partner APIs (PACE-oriented), separate from plan-manager billing exports and Stripe participant payments.

## Who this is for

| Role | Funding | Pathway |
|------|---------|---------|
| Registered provider | **Agency-managed** participant | `lib/ndia-provider-claiming` → NDIA API |
| Plan manager | Plan-managed | Plan manager export — **not** this module |
| Participant | Self-managed / private | Stripe Checkout or manual reimbursement |

## Prerequisites

1. **NDIA digital provider integration** — complete [Connecting with NDIA systems](https://www.ndis.gov.au/providers/working-provider/connecting-ndia-systems) and obtain API credentials.
2. **Organisation record** — `ndisRegistrationClaimed` and `ndisRegistrationNumber` on `Organisation`.
3. **Participant NDIS number** — encrypted on `ParticipantProfile.ndisParticipantNumberEnc`.
4. **Support items** — line-level `supportItemCode` / `ndisLineItem` within catalogue price caps.
5. **myID + RAM** — replace PRODA for portal access (NDIA requirement).

## Environment

```env
NDIS_CLAIM_SUBMISSION_ENABLED=true
NDIA_READINESS_ENABLED=true

# Mock (default) — records submission locally, no HTTP
NDIA_PROVIDER_ADAPTER_MODE=mock

# Live API (after NDIA onboarding)
NDIA_PROVIDER_ADAPTER_MODE=http
NDIA_REAL_SUBMISSION_ENABLED=true
NDIA_PROVIDER_API_BASE_URL=https://<ndia-api-host>
NDIA_PROVIDER_TOKEN_URL=https://<ndia-token-host>/oauth/token
NDIA_PROVIDER_API_CLIENT_ID=
NDIA_PROVIDER_API_CLIENT_SECRET=
NDIA_PROVIDER_CLAIM_SUBMIT_PATH=/v1/provider/claims
NDIA_PROVIDER_CLAIM_STATUS_PATH=/v1/provider/claims/{claimId}
NDIA_CLAIM_STATUS_POLL_ENABLED=true
NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL=true

# Request/response mapping (adjust when NDIA OpenAPI is issued)
NDIA_PAYLOAD_FORMAT=pace_v1
NDIA_RESPONSE_CLAIM_ID_FIELDS=claimId,id,externalId
NDIA_RESPONSE_STATUS_FIELDS=status,claimStatus,state

# Participant verification (scaffold — mock until NDIA plan API available)
NDIA_PARTICIPANT_API_ENABLED=false
```

Keep `NDIA_REAL_SUBMISSION_ENABLED=false` in development.

## Credential onboarding checklist

1. Complete NDIA provider digital integration onboarding.
2. Obtain OAuth client id/secret and API base URL from NDIA.
3. Set `NDIA_PROVIDER_ADAPTER_MODE=http` and `NDIA_REAL_SUBMISSION_ENABLED=true` in production only.
4. Run a dry run from `/provider/ndia-claims`, then submit one test claim in sandbox.
5. Confirm integration health in admin integrations (`ndia` adapter token probe).
6. Map OpenAPI field names via `NDIA_RESPONSE_*` env vars if NDIA response shape differs.

## API flow (provider)

| Step | Method | Path |
|------|--------|------|
| List claims | GET | `/api/provider/ndia-claims?organisationId=` |
| Build draft | POST | `/api/provider/ndia-claims` |
| Validate | POST | `/api/provider/ndia-claims/{id}/validate` |
| Dry run | POST | `/api/provider/ndia-claims/{id}/dry-run` |
| Submit | POST | `/api/provider/ndia-claims/{id}/submit` |
| Refresh status | GET | `/api/provider/ndia-claims/{id}/status` |

Permission: `provider:ndia:claim` (provider admin, MapAble admin).

### Create draft body

```json
{
  "organisationId": "org_…",
  "legacyInvoiceId": "inv_…"
}
```

Or `billingInvoiceId` for Core `BillingInvoice` records.

## Booking batch NDIA API path

When live submit is enabled, agency-managed claim batches exported via `/api/ndis/claim-batches/{id}/export` use the shared NDIA HTTP client (`adapter: ndia_api`). When live submit is disabled, batches continue to export portal CSV (`adapter: portal_export`).

Shared client: `lib/ndia/shared/ndia-http-client.ts`

## Error handling

NDIA HTTP failures are classified for the provider UI:

| Category | Typical HTTP | User message |
|----------|--------------|--------------|
| `auth` | 401, 403 | Check OAuth credentials |
| `validation` | 4xx | NDIA rejected the claim payload |
| `duplicate` | 409 | Claim may already exist |
| `rate_limit` | 429 | Retry shortly |
| `server` | 5xx | NDIA service error |

Full raw responses are stored on `NdiaProviderClaimAudit` for reconciliation.

## UI

Provider console: `/provider/ndia-claims`

## Claim lifecycle

```
draft → validated → dry_run_passed → submitted → accepted / rejected / paid
```

- **Validate** — registration, participant NDIS number, support item codes, price caps, funding type.
- **Dry run** — passes validation; does not call NDIA.
- **Submit** — mock or HTTP adapter; writes `externalClaimId` and audit trail.
- **Refresh status** — polls NDIA when `NDIA_CLAIM_STATUS_POLL_ENABLED=true`.

## Data model

- `NdiaProviderClaim` — payload JSON, status, external IDs
- `NdiaProviderClaimAudit` — immutable action log

## Governance

- Plan-managed funding is **blocked** at validation.
- Live submit requires `NDIA_REAL_SUBMISSION_ENABLED` and HTTP adapter config.
- Optional `NdiaPilotApprovalRecord` when human approval is enforced.
- All submits write `AuditEvent` and claim audits.

## Extending the NDIA adapter

Update mapping in:

- `lib/ndia/shared/ndia-payload-mapper.ts` — request/response field mapping
- `lib/ndia/shared/ndia-http-client.ts` — OAuth, submit, status polling

Set `NDIA_PAYLOAD_FORMAT=internal` to send the MapAble payload unchanged when NDIA accepts the internal schema.

## Related modules

- `lib/ndis-pricing` — catalogue and price caps
- `lib/ndia-readiness` — evidence bundles (legacy invoice path)
- `lib/ndia/participant-api-client.ts` — participant/plan verification scaffold
- `lib/billing-core` — participant billing (not provider NDIA submit)

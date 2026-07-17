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
NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL=true
```

Keep `NDIA_REAL_SUBMISSION_ENABLED=false` in development.

## API flow (provider)

| Step | Method | Path |
|------|--------|------|
| List claims | GET | `/api/provider/ndia-claims?organisationId=` |
| Build draft | POST | `/api/provider/ndia-claims` |
| Validate | POST | `/api/provider/ndia-claims/{id}/validate` |
| Dry run | POST | `/api/provider/ndia-claims/{id}/dry-run` |
| Submit | POST | `/api/provider/ndia-claims/{id}/submit` |

Permission: `provider:ndia:claim` (provider admin, MapAble admin).

### Create draft body

```json
{
  "organisationId": "org_…",
  "legacyInvoiceId": "inv_…"
}
```

Or `billingInvoiceId` for Core `BillingInvoice` records.

## UI

Provider console: `/provider/ndia-claims`

## Claim lifecycle

```
draft → validated → dry_run_passed → submitted → accepted / rejected / paid
```

- **Validate** — registration, participant NDIS number, support item codes, price caps, funding type.
- **Dry run** — passes validation; does not call NDIA.
- **Submit** — mock or HTTP adapter; writes `externalClaimId` and audit trail.

## Data model

- `NdiaProviderClaim` — **masked** payload JSON, status, external IDs, `currentSnapshotId`, `payloadHash`
- `NdisClaimSnapshot` — immutable masked + encrypted claim snapshot (Wave 2)
- `NdisClaimApproval` — claim/org/payload-hash specific approval (Wave 2)
- `NdiaProviderClaimAudit` — immutable action log (sanitised)

See `docs/ndis-gateway/wave-2-private-claim-storage.md`.

## Governance

- Plan-managed and self-managed funding are **blocked** for registered-provider direct claiming.
- Live submit requires claim-specific snapshot approval (not `NdiaPilotApprovalRecord`), plus `NDIA_REAL_SUBMISSION_ENABLED` and HTTP adapter config.
- `NdiaPilotApprovalRecord` is historical/pilot readiness only — it must never authorise an individual claim.
- Ordinary `claimPayloadJson` must not contain raw participant NDIS numbers.
- All submits write sanitised `AuditEvent` and claim audits.

## Related modules

- `lib/ndis-pricing` — catalogue and price caps
- `lib/ndia-readiness` — evidence bundles (legacy invoice path)
- `lib/billing-core` — participant billing (not provider NDIA submit)

# ADR-002 — NDIA authorisation-ready adapter with live transport blocked

**Status:** Accepted for draft implementation  
**Date:** 2026-11-08 (Australia/Sydney)  
**Supersedes / extends:** [NDIA_GATEWAY_ADAPTER_V1.md](./NDIA_GATEWAY_ADAPTER_V1.md) (PR #28 synthetic boundary)

## Context

MapAble has:

1. A fail-closed synthetic NDIA gateway contract (`lib/ndis/api-gateway/ndia-gateway-contract.ts`) that never transmits.
2. A legacy provider-claiming path (`lib/ndis/provider-claiming/*`) that:
   - assumes `client_credentials` OAuth and a default `/v1/provider/claims` path (**not independently verified** against authorised NDIA technical packs);
   - can record internal `submitted` after a **mock** response;
   - conflates local draft, synthetic validation, and government acknowledgement.

Official public onboarding ([How to connect to our systems](https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems)) requires Digital Partnership Office application, cyber clearance, and an NDIA-issued **technical pack** before endpoint/auth contracts are known. The API Developer Portal ([apiportal.ndis.gov.au](https://apiportal.ndis.gov.au/)) points back to that process; it does not publish claim URL paths for unauthenticated use.

## Decision

1. **Do not invent** NDIA URL paths, OAuth grant types, PRODA/myID API semantics, or response schemas. Live transport remains `NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED` until DPO provides approved specs and organisational approvals exist.
2. **Separate lifecycle phases** in application code (independent of Prisma enum until a future migration):
   - `internal_draft`
   - `synthetic_validated`
   - `pending_human_approval`
   - `government_submission_blocked` (ready locally but transport forbidden)
   - `submitted_pending_ack` (reserved; unreachable without authorised transport)
   - `acknowledged` / `rejected` / `reconciliation_pending` / `reconciled` (reserved for real NDIA evidence only)
3. **Mock / synthetic outcomes never set** Prisma `submitted` / `accepted` / `paid`. They map to `dry_run_passed` + `externalStatus` markers such as `synthetic_validation_only`.
4. Keep **trust boundaries** separate: NDIA claiming ≠ NDIS Commission ≠ Services Australia portal identity ≠ healthcare FHIR ≠ DoHDA aged-care B2G.
5. Server-side adapters only; organisation-scoped authorisation; participant consent or explicit lawful-authority proof before shareable claim payloads leave the org boundary; credentials never logged; minimal audit disclosure.
6. Production connectivity and claim submission remain **disabled**. `NDIA_REAL_SUBMISSION_ENABLED` is treated as a hazard signal, not authority.

## Consequences

- Existing HTTP submit path in `ndia-api-client.ts` is replaced with a hard throw (no network).
- Claim service mock path stops writing `status: "submitted"`.
- Future authorised transport must be a new module fed by NDIA technical-pack schemas, behind a new explicit flag after human go/no-go.
- No representation of MapAble as an approved NDIA digital partner.

## Non-goals

- Live claim submission, reconciliation against NDIA payments, or credential vault production wiring.
- Merging/deploying/enabling production flags.
- Reusing myID/RAM browser sessions as machine API auth.
- Mixing Commission worker-screening or aged-care B2G into this adapter.

# NDIA adapter — security evidence (Wave remediation)

**Date:** 2026-11-08 (Australia/Sydney)  
**Related:** [NDIA_ADAPTER_SECURITY_ADR.md](./NDIA_ADAPTER_SECURITY_ADR.md), [NDIA_GATEWAY_ADAPTER_V1.md](./NDIA_GATEWAY_ADAPTER_V1.md), draft PR #28

## Verified official sources (no invented endpoints)

| Source | What it establishes | What it does **not** establish |
|---|---|---|
| [How to connect to our systems](https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems) | DPO onboarding, cyber clearance, technical pack after approval; direct vs indirect integration | Claim URL paths, OAuth grant type, request schemas |
| [API Developer Portal](https://apiportal.ndis.gov.au/) | Portal exists; access follows DPO process | Unauthenticated OpenAPI for claims |
| [myplace provider portal resources](https://ndis.gov.au/myplace-provider-portal-and-resources) | Portal identity evolving (myID/RAM vs PRODA for portals) | That portal login equals approved machine API auth |
| NDIS Commission digital registration guidance | Separate Commission trust boundary | NDIA claiming entitlement |

## Audit findings and remediations

| Finding | Severity | Remediation in this change |
|---|---|---|
| Invented `/v1/provider/claims` + assumed `client_credentials` | High | Live HTTP removed; `assertNdiaLiveTransportBlocked`; invented path rejector |
| Mock result written as Prisma `submitted` | High | Synthetic path persists `dry_run_passed` + `synthetic_validation_only`; `submittedAt` null; invoices not flipped |
| Lifecycle conflation | High | `lifecycle.ts` phases; mapping helpers; tests |
| Cross-boundary risk (B2G/FHIR/Commission) | Med | `trust-boundaries.ts` + source isolation tests |
| Weak org / consent gates on progression | Med | `authority.ts` org + billing consent / lawful-authority attestation |
| Secrets in audit payloads | Med | Redaction in `writeClaimAudit` |
| Idempotency / replay | Med | Idempotency key helper; duplicate synthetic soft-block |
| Legacy `NDIA_REAL_SUBMISSION_ENABLED` treated as authority | High | Treated as hazard; still cannot open network |
| Integration health “healthy” on flag alone | Med | Fixed in PR #28 (`degraded` / unverified) |

## Test evidence (expected)

- Disabled flags → no progression / feature errors
- Unauthorised org / cross-tenant → denied
- Consent withdrawal / missing consent → denied unless lawful authority attested
- Live transport attempts → `NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED` (no fetch)
- Invented submit path env → blocked
- Synthetic submit → `notSubmitted: true`, never Prisma `submitted`
- Duplicate synthetic → blocked / no second government implication
- Token fetch helper → throws disabled (never used by submit)
- Trust-boundary source strings → isolation assertions

## Explicit non-claims

- MapAble is **not** represented as an approved NDIA digital partner.
- No government API call, claim submission, merge, deploy, or production flag enablement is authorised by this document.
- Stop before implementing live transport until DPO provides approved technical specifications and required organisational, cyber-security, and regulatory approvals.

## Accessibility

Admin readiness and claiming UIs target WCAG 2.2 AA (keyboard, screen reader, AAC/switch, 200–400% zoom). Human-reviewed draft/export fallbacks remain available when NDIA transport is unavailable; do not assert acceptance or payment.

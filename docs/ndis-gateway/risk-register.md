# NDIS Gateway — Risk Register

**Wave:** 0  
**Purpose:** Verified defects and category risks (privacy, fraud, duplicate payment, wrong funding route, stale pricing, unavailable external API). Each entry includes severity, affected files, failure scenario, remediation wave, and a named regression test to add.

Severity scale: **Critical** (data misuse / wrong payment path / authorisation bypass), **High** (material incorrect claims or privacy leakage), **Medium** (inconsistent enforcement), **Low** (operational / documentation).

---

## 1. Verified defects from implementation pack

### R1 — Unsupported funding defaults to agency-managed

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected files** | `lib/ndia-provider-claiming/validate.ts` (`mapBillingFundingType`), callers in `claim-service.ts` |
| **Scenario** | Invoice funded by `private_card`, `grant`, `organisation_invoice`, or `other` is mapped to `ndis_agency_managed`. Provider claim draft proceeds as if NDIA-managed. Risk of wrongful NDIS submission / fraud / participant harm. |
| **Remediation** | Wave 1: map only explicit NDIS types; `private_card` → `private_pay`; everything else → `unknown` and block. Never fall through to agency-managed. |
| **Regression test** | `fundingRoute.private_card_cannot_map_to_ndia_managed` |

### R2 — Self-managed not blocked for direct provider claiming

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `lib/ndia-provider-claiming/validate.ts` (`validateFundingForProviderClaim`) |
| **Scenario** | Self-managed funding yields a **warning** only. Draft can validate and submit (mock/live) as a registered-provider claim. Wrong funding route; participant should receive invoice, not provider NDIA claim. |
| **Remediation** | Wave 1/4: treat self-managed as **error** for direct provider path; route via `self_managed_invoice` only. |
| **Regression test** | `fundingRoute.self_managed_blocks_direct_provider_submission` |

### R3 — Direct claim JSON persists decrypted NDIS number

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected files** | `lib/ndia-provider-claiming/build-claim.ts`, `claim-service.ts` (`claimPayloadJson`), Prisma `NdiaProviderClaim` |
| **Scenario** | Full `participant.ndisNumber` stored in JSON. List endpoint returns claim rows including payload. DB dump, support export, or over-broad API client exposes identifiers. |
| **Remediation** | Wave 2: encrypted snapshots; masked relational fields; decrypt only in server submission boundary. |
| **Regression test** | `privacy.api_list_response_has_no_raw_ndis_number` |

### R4 — Live submission approval is not claim-specific (and skipped when live allowed)

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `lib/ndia-provider-claiming/claim-service.ts` (`submitProviderClaim`), `config.ts` |
| **Scenario** | When `requireHumanApproval` is true **and** live submit is allowed, the approval-record check is skipped (`!isNdiaProviderLiveSubmitAllowed() && !approval`). Live path can submit without claim-bound human approval. |
| **Remediation** | Wave 2/5: require unexpired `NdisClaimApproval` for current payload hash for **every** live submit; never skip when live is on. |
| **Regression test** | `approval.live_submission_without_approval_rejected` |

### R5 — Approval lookup accepts unrelated pilot approval

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected files** | `lib/ndia-provider-claiming/claim-service.ts` (`ndiaPilotApprovalRecord.findFirst({ where: { approved: true } })`), `NdiaPilotApprovalRecord` model |
| **Scenario** | Any global approved pilot record authorises submit for any claim/org when live is off. Org A’s approval (or a stale pilot toggle) unlocks Org B claim. |
| **Remediation** | Wave 2: claimId + organisationId + payloadHash scoped approvals; reject cross-claim/cross-org/expired/revoked. |
| **Regression tests** | `approval.unrelated_claim_rejected`, `approval.unrelated_organisation_rejected` |

### R6 — NDIA endpoint and OAuth assumptions are placeholders

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `lib/ndia-provider-claiming/ndia-api-client.ts`, `config.ts`, `docs/ndia-provider-claiming.md` |
| **Scenario** | Default path `/v1/provider/claims` and `client_credentials` may not match any approved technical pack. Enabling live flags could call wrong hosts/schemas or create false confidence. |
| **Remediation** | Wave 5: `NdiaDigitalPartnerAdapter` disabled scaffold; endpoint registry and auth strategy from secure config only; private fixtures never committed. |
| **Regression test** | `adapter.ndia_direct_disabled_without_technical_pack_config` |

### R7 — Billing invoice service periods from createdAt / dueAt

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `lib/ndia-provider-claiming/build-claim.ts` (`buildClaimFromBillingInvoice`), `BillingInvoice` / `BillingInvoiceLineItem` schema |
| **Scenario** | Service period end uses `dueAt` (payment due date). Line service dates use line `createdAt`. Claims validate against wrong price release / wrong service window; remittance mismatch. |
| **Remediation** | Wave 4: require actual service dates on lines; never use due date as service end; fail closed if missing. |
| **Regression test** | `builder.billing_invoice_service_period_uses_line_service_dates` |

### R8 — Unknown support item severity differs between engines

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected files** | `lib/ndia-provider-claiming/validate.ts` (warning), `lib/ndis/claiming/validation.ts` (error) |
| **Scenario** | Provider path can dry-run/submit with unknown codes (if no other errors); portal path blocks. Inconsistent compliance posture. |
| **Remediation** | Wave 4: unknown support item always blocking for submission. |
| **Regression test** | `pricing.unsupported_item_blocked` |

### R9 — Claiming catalogue cannot safely preserve multiple releases

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `prisma/schema.prisma` (`NdisPricingCatalogueItem.supportItemCode @unique`), `catalogue-sync.ts`, portal validation |
| **Scenario** | Upserts overwrite caps for a code. Historical claims revalidated against current prices; price limits change retroactively. Parallel versioned catalogue exists but claiming path does not use it. |
| **Remediation** | Wave 3: release-versioned rules; resolve by service date; never mutate prior releases. |
| **Regression test** | `pricing.historical_service_date_uses_correct_release` |

### R10 — No complete external status / remittance reconciliation path

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | Provider status enums; `/provider/ndis-claims/reconciliation` UI; absence of remittance import models/APIs |
| **Scenario** | Paid/rejected status may be set manually or incompletely. Duplicate payment posting; one rejected line incorrectly treated as whole-batch rejection; no append-only external events. |
| **Remediation** | Wave 7: external events, import, poll/webhook (when documented), line-level reconcile, exception queues. |
| **Regression tests** | `reconciliation.partial_payment`, `reconciliation.line_rejection`, `reconciliation.duplicate_remittance` |

### R11 — External error bodies included in thrown errors

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `lib/ndia-provider-claiming/ndia-api-client.ts` (non-OK response throw) |
| **Scenario** | Upstream error payload (may contain participant or token material) surfaces in logs, APM, client error messages. |
| **Remediation** | Wave 5: structured redacted errors; encrypt raw responses only where required; never put response body in `Error.message`. |
| **Regression test** | `submission.network_error_is_redacted` |

### R12 — Retries and idempotency incomplete

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `ndia-api-client.ts` (mock id `Date.now()`), `claim-service.ts` submit (no idempotency key) |
| **Scenario** | Client retry after timeout creates second external claim; ambiguous submit outcome auto-retried without guarantee → duplicate payment. |
| **Remediation** | Wave 5/7: deterministic idempotency keys; acquire store before submit; no auto-retry on ambiguous submit unless idempotency guaranteed; circuit breaker + backoff. |
| **Regression tests** | `submission.deterministic_idempotency_key`, `submission.repeated_submit_returns_existing_receipt`, `submission.ambiguous_timeout_does_not_duplicate` |

---

## 2. Additional verified / related risks

### R13 — Plaintext NDIS number on billing funding source

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `BillingFundingSource.ndisParticipantNumber`, `lib/billing-core/funding-source-service.ts`, `export-service.ts` |
| **Scenario** | Identifier stored/exported in plaintext outside crypto helper. |
| **Remediation** | Wave 2+: encrypt or remove; exports use masked values unless secure break-glass. |
| **Regression test** | `privacy.billing_funding_source_export_masks_ndis_number` |

### R14 — List NDIA claims returns full payload JSON

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected files** | `listProviderClaims` in `claim-service.ts`, `GET /api/provider/ndia-claims` |
| **Scenario** | Ordinary list UI/API exposes decrypted NDIS numbers to any user with `provider:ndia:claim` for that org. |
| **Remediation** | Wave 2: list DTOs return masked fields only. |
| **Regression test** | `privacy.api_list_response_has_no_raw_ndis_number` |

### R15 — Submit audit `after` may store raw submit result

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected files** | `writeClaimAudit(..., result)` on submit |
| **Scenario** | External response fragments land in audit JSON. |
| **Remediation** | Wave 2/5: redact audit payloads; encrypt raw retention separately. |
| **Regression test** | `privacy.raw_ndis_number_absent_from_audit_json` |

### R16 — Unused auto-claiming flag

| Field | Detail |
|-------|--------|
| **Severity** | Medium (governance) |
| **Affected files** | Config for `NDIS_AUTO_CLAIMING_ENABLED` |
| **Scenario** | Future wiring could allow autonomous submit contrary to “no AI/auto submit” rule. |
| **Remediation** | Keep off; Wave 5+ explicitly forbid automated submit; document in readiness pack. |
| **Regression test** | `governance.auto_claiming_cannot_submit_live` |

### R17 — Permissions defined but unused as route guards

| Field | Detail |
|-------|--------|
| **Severity** | Low–Medium |
| **Affected files** | `lib/auth/permissions.ts` (`ndis:manage`, `ndis:pricing:manage`, `ndia:readiness`, `ndia:pilot`) |
| **Scenario** | Admins rely on coarse `requireApiAdmin`; finer RBAC incomplete for Wave 8 control centre. |
| **Remediation** | Wave 7/8: wire permissions to routes; audit MapAble admin access. |
| **Regression test** | `authorisation.mapable_admin_access_is_audited` |

---

## 3. Category risks (required)

### Privacy

| ID | Risk | Severity | Wave | Regression |
|----|------|----------|------|------------|
| P1 | Raw NDIS number in claim JSON / list / audit / logs | Critical | 2 | See R3, R14, R15; `privacy.*` suite |
| P2 | Encryption key fallback to `NEXTAUTH_SECRET` / hard-coded dev key | High | 2/9 | `privacy.encryption_key_required_in_production` |
| P3 | Insecure staff export of claim packages | High | 5/9 | `privacy.export_contains_only_masked_identifiers` |

### Fraud / wrong funding route

| ID | Risk | Severity | Wave | Regression |
|----|------|----------|------|------------|
| F1 | Private/unknown funding claimed as NDIA-managed | Critical | 1 | R1 tests |
| F2 | Self/plan-managed on direct provider path | High | 1/4 | R2; plan-managed already blocked — keep |
| F3 | Support item substitution / amount tampering after approval | Critical | 2/4 | `approval.claim_edit_invalidates_approval` |
| F4 | Provider impersonation / cross-org access | Critical | existing + 7 | `authorisation.provider_staff_cannot_access_other_org` |

### Duplicate payment

| ID | Risk | Severity | Wave | Regression |
|----|------|----------|------|------------|
| D1 | Ambiguous timeout retry duplicates external claim | High | 5/7 | R12 tests |
| D2 | Duplicate remittance posting | High | 7 | `reconciliation.duplicate_remittance` |
| D3 | Near-duplicate claim lines from same booking | Medium | 4 | Portal duplicate detection exists; extend property tests |

### Stale pricing

| ID | Risk | Severity | Wave | Regression |
|----|------|----------|------|------------|
| S1 | Cap overwrite loses history | High | 3 | R9 |
| S2 | Claim validated against current release not service date | High | 3/4 | `pricing.correct_release_by_service_date` |
| S3 | Missing regional / remote price inferred incorrectly | High | 3 | `pricing.missing_regional_price_blocked`; fail closed |

### Unavailable / untrusted external API

| ID | Risk | Severity | Wave | Regression |
|----|------|----------|------|------------|
| A1 | Live call without technical pack | High | 5 | R6 |
| A2 | Redirect / non-allowlisted host | High | 5 | `adapter.hostname_allowlist_enforced` |
| A3 | Forged webhook / malicious response upload | High | 7 | `reconciliation.malformed_response_rejected`, `reconciliation.wrong_organisation_rejected` |
| A4 | False paid status from unknown external code | High | 7 | `submission.unknown_external_status_preserved` |
| A5 | Portal export mistaken for automated portal scrape | Medium | docs/5 | Policy: manual confirmation only; no scraping |

---

## 4. Threat themes for Wave 9 threat model (preview)

Participant identifier disclosure; provider impersonation; compromised org admin; claim amount tampering; support item substitution; duplicate submission; replay; stale approval; price-release manipulation; malicious response-file upload; forged webhook; compromised API credential; sensitive logging; insecure staff export; cross-organisation access; insider misuse; ambiguous network timeout after submit; false paid status; correction-chain deletion.

Full threat model and PIA belong in Wave 9 under `docs/ndis-gateway/readiness/`.

---

## 5. Residual acceptances until later waves

| Item | Accept until | Compensating control today |
|------|--------------|----------------------------|
| Dual claim engines | Wave 4–7 | Documented dual UI; no third engine |
| Placeholder NDIA HTTP | Wave 5 | Live flags default off; mock default |
| Reconciliation incomplete | Wave 7 | Manual status updates; portal mark-submitted |
| WCAG 2.2 AA control centre | Wave 8 | Existing screens remain; do not regress a11y intentionally |
| Australian residency | Wave 9 statement | Infra assumption; not coded in claim libs |

---

## 6. Traceability

| Defect | Primary remediation wave |
|--------|--------------------------|
| R1, R2 | 1 (domain) + 4 (rules) |
| R3, R4, R5, R13–R15 | 2 |
| R8, R7 | 4 |
| R9 | 3 |
| R6, R11, R12, R16 | 5 (+7 for full idempotency/reconcile) |
| R10, A3–A4 | 7 |
| R17, a11y | 8 |
| P2, residency, threat model | 9 |

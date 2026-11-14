# NDIS Gateway — Current State Audit

**Wave:** 0  
**Repository:** `ausdisau/mapableau-new`  
**Package:** `MapableAU` (pnpm, Next.js App Router, Prisma, PostgreSQL)  
**Audit date:** 2026-07-16  
**Scope:** Read-only inventory of existing NDIS claiming, pricing, provider-directory, invoice, and NDIA submission modules. No runtime code was changed in this wave.

---

## 1. Executive summary

The repository contains **two overlapping claim systems** plus supporting pricing, readiness, billing, and provider-directory modules:

| Engine | Path | Primary audience | Persistence |
|--------|------|------------------|-------------|
| Portal-assisted multi-route claiming | `lib/ndis/claiming` | All three NDIS payment routes via CSV / invoices | `NdisClaimLine`, `NdisClaimBatch`, `NdisInvoice`, `ClaimAuditEvent` |
| Registered-provider NDIA claiming | `lib/ndia-provider-claiming` | Agency-managed, registered providers | `NdiaProviderClaim`, `NdiaProviderClaimAudit` |

There is **no** `lib/ndis-gateway` package yet. Live NDIA HTTP submission is disabled by default (`NDIA_REAL_SUBMISSION_ENABLED` off, adapter mode `mock`). Portal bulk export and plan/self-managed invoices are first-class paths today.

---

## 2. Library modules

### 2.1 `lib/ndis/claiming/`

| File | Role |
|------|------|
| `types.ts` | Claim line / batch / validation / adapter types |
| `paymentRoute.ts` | `FundingSourceType` → `NdisPaymentRoute` (null for unsupported) |
| `validation.ts` | Service delivery, catalogue, My Provider, duplicates |
| `claim-service.ts` | Create from booking, validate, batch, export, correct/resubmit, search |
| `batchBuilder.ts` | Batch construction helpers |
| `catalogue-sync.ts` | Sync `NdisSupportItem` → `NdisPricingCatalogueItem` |
| `adapters/PortalExportAdapter.ts` | Bulk CSV export metadata; marks exported |
| `adapters/SelfManagedInvoiceAdapter.ts` | Persist `NdisInvoice` for participants |
| `adapters/PlanManagerInvoiceAdapter.ts` | Persist `NdisInvoice` for plan managers |
| `adapters/NdiaApiAdapter.stub.ts` | Always throws “not configured” |
| `exporters/bulkPaymentRequestExporter.ts` | NDIA-managed CSV (masked participant numbers) |

Related under `lib/ndis/` (not under `claiming/`): service-delivery helpers, participant–provider relationship service, suggestion service.

### 2.2 `lib/ndia-provider-claiming/`

| File | Role |
|------|------|
| `types.ts` | `NdiaProviderClaimPayload`, findings |
| `config.ts` | Env flags; live-submit gate |
| `validate.ts` | Funding map, funding rules, payload validation |
| `build-claim.ts` | Build from legacy `Invoice` or `BillingInvoice` |
| `claim-service.ts` | Draft, validate, dry-run, submit, list |
| `ndia-api-client.ts` | Mock or HTTP OAuth client-credentials submit |

### 2.3 Supporting modules

| Module | Path | Role |
|--------|------|------|
| Pricing import | `lib/ndis-pricing/catalogue-import-service.ts` | Import job create / validate / apply; invoice price warnings |
| NDIA readiness | `lib/ndia-readiness/evidence-bundle-service.ts` | Evidence bundles, dry-run (blocks if real submit on), export |
| NDIA pilot | `lib/ndia-pilot/ndia-pilot-service.ts` | Pilot status; dry-run wrapper |
| Billing funding | `lib/billing-core/funding-logic.ts`, `funding-source-service.ts`, `schemas.ts`, `export-service.ts`, `invoice-service.ts` | Checkout vs plan-manager routing; funding CRUD; PM export may include NDIS number |
| Crypto | `lib/crypto/ndis.ts` | AES-256-GCM encrypt/decrypt/mask |
| Integration health | `lib/integrations/adapters/ndia-adapter.ts` | Integration registry readiness |

### 2.4 Documentation already in repo

| Path | Focus |
|------|--------|
| `docs/ndia-provider-claiming.md` | Registered-provider module |
| `docs/data/ndis-provider-registry-prisma.md` | Provider outlet registry |
| `docs/mapable/core-phases.md` | Pilot / governance notes |
| `docs/billing.md` | Broader billing |

---

## 3. API routes

### 3.1 Portal-assisted NDIS (`/api/ndis/**`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/ndis/support-items` | Session | List active support items (max 200) |
| POST | `/api/ndis/support-items` | Admin | Create support item |
| POST | `/api/ndis/suggest-line-item` | Session + source access | Suggest line item; human-review disclaimer |
| GET | `/api/ndis/service-delivery/mechanisms` | **Public** | Delivery mechanism catalogue |
| POST | `/api/ndis/service-delivery/events` | `provider:ndis:claim` | Record delivery event |
| GET/POST | `/api/ndis/service-delivery/authorizations` | `provider:ndis:claim` | List / create authorizations |
| PATCH | `/api/ndis/service-delivery/authorizations/[id]` | `provider:ndis:claim` | Update / activate |
| POST | `/api/ndis/pricing/import` | Admin | Import pricing catalogue rows |
| GET/POST | `/api/ndis/participant-provider-relationships` | Session / claim perm | List / upsert relationships |
| PATCH | `/api/ndis/participant-provider-relationships/[id]` | Session + manage | Update relationship |
| POST | `/api/ndis/claims/from-booking` | `provider:ndis:claim` | Create claim line from completed booking |
| POST | `/api/ndis/claims/validate` | `provider:ndis:claim` | Re-validate claim line |
| GET | `/api/ndis/claims/search` | `provider:ndis:claim` | Search lines (no NDIS number in select) |
| POST | `/api/ndis/claim-lines/[id]/status` | `provider:ndis:claim` | Status update or correct+resubmit |
| POST | `/api/ndis/claim-batches` | `provider:ndis:claim` | Create batch (422 on validation failure) |
| GET | `/api/ndis/claim-batches/[id]` | `provider:ndis:claim` | Get batch + lines |
| POST | `/api/ndis/claim-batches/[id]/validate` | `provider:ndis:claim` | Validate batch |
| POST | `/api/ndis/claim-batches/[id]/export` | `provider:ndis:claim` | Export CSV/invoice payload (base64) |
| POST | `/api/ndis/claim-batches/[id]/mark-submitted` | `provider:ndis:claim` | Mark submitted in portal |

### 3.2 Registered-provider NDIA (`/api/provider/ndia-claims/**`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/provider/ndia-claims?organisationId=` | `provider:ndia:claim` | List org claims |
| POST | `/api/provider/ndia-claims` | `provider:ndia:claim` | Draft from `legacyInvoiceId` or `billingInvoiceId` |
| POST | `/api/provider/ndia-claims/[claimId]/validate` | `provider:ndia:claim` | Validate |
| POST | `/api/provider/ndia-claims/[claimId]/dry-run` | `provider:ndia:claim` | Dry run (no NDIA call) |
| POST | `/api/provider/ndia-claims/[claimId]/submit` | `provider:ndia:claim` | Mock or live submit |

Gated by `NDIS_CLAIM_SUBMISSION_ENABLED` → 503 when off.

### 3.3 Admin / ops

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/admin/ndia-readiness/evidence-bundles/from-invoice/[invoiceId]` | Admin | Evidence bundle; `notSubmittedToNdia: true` |
| GET | `/api/admin/ndia-pilot` | Admin | Pilot status |
| POST | `/api/admin/ingest/ndis-providers` | Cron/admin ingest auth | Provider registry ingest |

**Name collisions (not NDIS claims):** `/api/profiles/claim`, `/api/access/places/.../claim`.

---

## 4. Provider console screens

| Path | Permission | Notes |
|------|------------|-------|
| `/provider/claiming` | Hub | Links portal-assisted and NDIA API paths |
| `/provider/ndis-claims` | `provider:ndis:claim` | Redirects → `/ready` |
| `/provider/ndis-claims/ready` | same | Ready-to-claim lines |
| `/provider/ndis-claims/batches` | same | Batch builder |
| `/provider/ndis-claims/validation-errors` | same | Validation errors |
| `/provider/ndis-claims/export` | same | Export batch |
| `/provider/ndis-claims/rejected` | same | Rejected lines |
| `/provider/ndis-claims/reconciliation` | same | Reconciliation UI (no remittance import backend) |
| `/provider/ndia-claims` | `provider:ndia:claim` | NDIA API claiming UI |

Admin (related): `/admin/ndia-readiness`, `/admin/ndia-pilot`, `/admin/ndis-provider-ingestion`.

---

## 5. Database models and enums

### 5.1 Funding / payment enums

| Enum | Values |
|------|--------|
| `FundingSourceType` | `ndis_self_managed`, `ndis_plan_managed`, `ndis_agency_managed`, `private_pay`, `aged_care`, `employer`, `other` |
| `BillingFundingSourceType` | `ndis_plan_managed`, `ndis_self_managed`, `private_card`, `organisation_invoice`, `grant`, `other` |
| `NdisPaymentRoute` | `self_managed`, `plan_managed`, `ndia_managed` |

**Mapping helpers (inconsistent):**

- `fundingSourceToPaymentRoute` — unsupported → `null` (safe).
- `mapBillingFundingType` — unknown billing types → `ndis_agency_managed` (**defect R1**).

### 5.2 Claim status enums

| Enum | Values |
|------|--------|
| `NdisClaimLineStatus` | `draft`, `validated`, `validation_failed`, `included_in_batch`, `exported`, `submitted`, `pending`, `paid`, `rejected`, `corrected`, `resubmitted`, `voided` |
| `NdisClaimBatchStatus` | `draft`, `validated`, `approved`, `exported`, `submitted_in_portal`, `partially_paid`, `paid`, `rejected`, `closed` |
| `NdiaProviderClaimStatus` | `draft`, `validated`, `dry_run_passed`, `submitted`, `accepted`, `rejected`, `paid`, `failed` |
| `NdisClaimType` | `standard`, `cancellation`, `non_face_to_face`, `irregular_sil`, `other` |

### 5.3 Core claim / invoice models

- **Portal:** `NdisClaimBatch`, `NdisClaimLine` (optional masked `ndisParticipantNumber`), `NdisInvoice`, `NdisInvoiceLine`, `ClaimAuditEvent`, `ParticipantProviderRelationship`
- **Provider NDIA:** `NdiaProviderClaim` (`claimPayloadJson` Json), `NdiaProviderClaimAudit`
- **Delivery:** `NdisServiceDeliveryAuthorization`, `NdisServiceDeliveryEvent`
- **Legacy / billing:** `Invoice`, `InvoiceLine`, `BillingInvoice`, `BillingInvoiceLineItem` (no service-date column on line items), `BillingFundingSource` (optional plaintext `ndisParticipantNumber`)
- **Participant:** `ParticipantProfile.ndisParticipantNumberEnc`
- **Organisation:** `ndisRegistrationClaimed`, `ndisRegistrationNumber`

### 5.4 Pricing models (two parallel systems)

| System | Models | Used by |
|--------|--------|---------|
| Claiming catalogue | `NdisPricingCatalogueItem` (`supportItemCode` **@unique**) | Portal claiming validation |
| Versioned catalogue | `NdisPriceCatalogue` → `Version` → `NdisSupportItemPrice`; import jobs/rows/changes | Admin pricing import path |
| Support items | `NdisSupportItem` (`code` @unique), `NdisSupportCategory` | Both engines (provider engine uses this only) |

### 5.5 Provider directory

- `ProviderOutletRegistry` (`provider_outlets`)
- `NdisProvider`, `NdisProviderIngestionRun`
- `ClaimedProvider` (user-claimed finder outlets)

### 5.6 NDIA readiness / pilot

- `NdiaIntegrationProfile`, `NdiaApiReadinessChecklist`, `NdiaClaimEvidenceBundle`, `NdiaAdapterConfig`, `NdiaSubmissionDryRun`, `NdiaIntegrationAudit`
- `NdiaPilotApprovalRecord` (global boolean approval — **not claim-scoped**)
- `NdiaPilotSubmissionDryRun`

### 5.7 Relevant migrations

| Migration | Role |
|-----------|------|
| `20260521000000_mapable_core_phase_1` | Encrypted NDIS number on profile |
| `20260525000000_mapable_access_phase_1` | Funding, invoices, support/pricing, NDIA readiness/claims, billing |
| `20260525000000_ndis_direct_claiming` | Batches/lines/invoices/catalogue/relationships |
| `20260607120000_ndis_service_delivery_mechanism` | Delivery auth + events |
| `20260608130000_ndis_provider_outlet_registry` | Outlet registry |
| `20260609120000_ndis_provider_ingestion` | `ndis_providers` + runs |

---

## 6. Adapters and submission

| Adapter | Location | Network |
|---------|----------|---------|
| Portal bulk export | `PortalExportAdapter` + CSV exporter | None (file for manual portal upload) |
| Self-managed invoice | `SelfManagedInvoiceAdapter` | None |
| Plan-manager invoice | `PlanManagerInvoiceAdapter` | None |
| NDIA API stub (portal engine) | `NdiaApiAdapter.stub` | None (throws) |
| Mock / HTTP NDIA client | `ndia-api-client.ts` | Mock local; HTTP when live flags set |
| Integration NDIA adapter | `lib/integrations/adapters/ndia-adapter.ts` | Health / readiness only |

**Placeholder assumptions (not to be treated as NDIA fact):**

- Default submit path `/v1/provider/claims`
- OAuth `client_credentials` token flow
- Response shape `{ claimId | id, status }`

---

## 7. Pricing and provider importers

### Pricing

- API: `POST /api/ndis/pricing/import` (admin)
- Service: `lib/ndis-pricing/catalogue-import-service.ts`
- Sync: `syncPricingCatalogueFromSupportItems` in claiming
- Flags: `NDIS_PRICING_IMPORT_ENABLED` (default on), `NDIS_SUPPORT_ITEM_IMPORT_ENABLED` (default on)
- Scripts: none named `ndis:pricing:*` yet (planned Wave 3)

### Provider directory

| Script / seed | Purpose |
|---------------|---------|
| `scripts/fetch-ndis-list-providers.ts` | Fetch public list JSON → `data/ndis/list-providers.json` |
| `scripts/ingest-ndis-providers.ts` | Normalise → `NdisProvider` + ingestion run |
| `scripts/import-provider-outlets-supabase.ts` | Upsert Supabase `provider_outlets` |
| `prisma/seed-ndis-provider-outlets.ts` | Upsert Prisma `ProviderOutletRegistry` |
| `scripts/backfill-ndis-provider-coords.ts` | Geocode missing coords (related) |

pnpm scripts: `fetch:ndis-list-providers`, `ingest:ndis-providers`, `ingest:ndis-providers:dry`, `seed:ndis-provider-outlets`, `import:provider-outlets-supabase`, `seed:ndis-service-delivery`.

---

## 8. Participant NDIS number usage

| Location | Storage form |
|----------|--------------|
| `ParticipantProfile.ndisParticipantNumberEnc` | Encrypted (AES-256-GCM) |
| Portal claim create | Decrypt for validation; **store masked** on `NdisClaimLine` |
| Portal search / list | Omits or uses masked values |
| Bulk CSV export | Masks again (already masked) |
| `NdiaProviderClaim.claimPayloadJson` | **Full decrypted** `participant.ndisNumber` persisted |
| `listProviderClaims` | Returns claim rows including `claimPayloadJson` |
| `BillingFundingSource.ndisParticipantNumber` | Optional **plaintext** |
| Plan-manager billing export | May embed plaintext NDIS number |
| Profile APIs | Mask / `hasNdisNumber` only |

Crypto key: `NDIS_ENCRYPTION_KEY` → else `NEXTAUTH_SECRET` → else hard-coded dev string.

---

## 9. Logging and sensitive data exposure

| Surface | Risk |
|---------|------|
| `ndia-api-client.ts` non-OK HTTP | Thrown error includes `JSON.stringify(json)` / raw text of response body |
| `NdiaProviderClaim.claimPayloadJson` | Full NDIS number at rest |
| Claim audit `after` on submit | May include submit `result` object |
| Ordinary `console.log` in claiming libs | No widespread NDIS number logging found; persistence is the primary risk |
| List NDIA claims API | Full payload JSON to authorised callers |

---

## 10. Feature flags / environment

| Variable | Default | Effect |
|----------|---------|--------|
| `NDIS_CLAIM_SUBMISSION_ENABLED` | **off** | Enables NDIA provider claiming module |
| `NDIA_REAL_SUBMISSION_ENABLED` | **off** | Allows live HTTP submit |
| `NDIA_PROVIDER_ADAPTER_MODE` | `mock` | `mock` \| `http` |
| `NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL` | **on** | Submit governance (see defects R4/R5) |
| `NDIA_PROVIDER_API_BASE_URL` / `TOKEN_URL` / client id/secret / submit path | empty | Live client config |
| `NDIA_READINESS_ENABLED` | on | Evidence bundles |
| `NDIS_PRICING_IMPORT_ENABLED` | on | Pricing import |
| `NDIS_SUPPORT_ITEM_IMPORT_ENABLED` | on | Support item import |
| `NDIS_AUTO_CLAIMING_ENABLED` | **off** | Defined; not wired into claim routes |
| `NDIA_PILOT_ENABLED` | **off** | Pilot service |
| `NDIS_SERVICE_DELIVERY_MECHANISM_ENABLED` | **off** | Delivery APIs |
| `NDIS_SERVICE_DELIVERY_REQUIRE_AUTH_FOR_CLAIMS` | off | Auth required in portal validation |
| `NDIS_ENCRYPTION_KEY` | fallback chain | Crypto |

Live provider submit requires: claiming enabled **and** real submission **and** `adapterMode === "http"` **and** `apiBaseUrl` set.

---

## 11. RBAC

| Permission | Roles | Used on |
|------------|-------|---------|
| `provider:ndis:claim` | `provider_admin`, `mapable_admin` | Portal claim + service delivery writes |
| `provider:ndia:claim` | same | NDIA provider claim APIs / UI |
| `ndis:manage` | `mapable_admin` | Defined; not used as route guard |
| `ndis:pricing:manage` | `mapable_admin` | Defined; unused as route guard |
| `ndia:readiness` | `mapable_admin` | Defined; admin routes use `requireApiAdmin` |
| `ndia:pilot` | `mapable_admin` | Defined; admin routes use role check |

Org scoping: `assertOrgAccess` / `getUserOrganisationIds` on claim operations. Participants may list own relationships only.

---

## 12. Audit event types

### `ClaimAuditEvent` (portal)

- `line.created_from_booking`, `line.validated`, `line.included_in_batch`, `line.resubmitted`
- `line.status.{submitted|pending|paid|rejected|corrected|resubmitted|voided}`
- `batch.created`, `batch.validated`, `batch.exported`, `batch.exported.portal`, `batch.marked_submitted_portal`

### `NdiaProviderClaimAudit.action`

- `draft_created`, `validated`, `dry_run_passed`, `submitted`

### Platform `AuditEvent.action`

- `ndia.provider_claim.draft`, `ndia.provider_claim.submitted`
- `ndia.bundle_created`, `ndia.bundle_exported`
- `participant_provider_relationship.upserted` / `.updated`
- `ndis_delivery_authorization.created` / `.activated`

---

## 13. Duplicate claim-building and validation logic

| Concern | Portal (`ndis/claiming`) | Provider (`ndia-provider-claiming`) |
|---------|--------------------------|-------------------------------------|
| Org access | Local `assertOrgAccess` | Duplicate local `assertOrgAccess` |
| Support item + price | Catalogue **or** support item; unknown = **error** | Support item only; unknown = **warning** |
| Funding | `fundingSourceToPaymentRoute` (null = block) | `mapBillingFundingType` + warnings/errors |
| Plan-managed | Invoice path allowed | Hard-blocked |
| Self-managed | Invoice path | Warning only (**R2**) |
| NDIS number | Masked at rest | Full in JSON (**R3**) |
| Audit | `ClaimAuditEvent` | `NdiaProviderClaimAudit` + `AuditEvent` |
| Validation shape | `ClaimValidationIssue` | `ClaimValidationFinding` |

---

## 14. Tests and coverage gaps

### Existing tests

| File | Covers |
|------|--------|
| `tests/ndis-direct-claiming.test.ts` | Payment-route mapping, bulk checksum, NDIA stub throws |
| `tests/ndia-provider-claiming.test.ts` | Funding rules (plan-managed block), payload shape |
| `tests/ndis-service-delivery-mechanism.test.ts` | Mechanism catalog, auth mapping |
| `tests/ndis-provider-ingestion.test.ts` | Parse/normalise, retry, cron bearer |
| `tests/ndis-list-providers-source.test.ts` | Bundled fixtures |
| `tests/security/ndis-phase2.test.ts` | Relationships, batch org isolation, suggestion ACL |
| `tests/provider-outlet-supabase-map.test.ts` | Outlet→DB mapping |
| `tests/mapable-phase5.test.ts` / `phase6` | Pricing duplicate-code; real submit disabled |
| `tests/billing-core.test.ts` | Checkout vs funding types |

### Gaps

- No unit tests for `lib/crypto/ndis.ts`
- No claim-specific / org-specific / payload-hash approval tests
- No proof that API list responses omit raw NDIS numbers for NDIA claims
- No log-sanitiser tests
- No remittance / reconciliation import tests
- No submit idempotency / ambiguous-timeout tests
- No service-date pricing resolution tests for claiming path
- Little integration coverage of claim-service DB flows

---

## 15. Production environment assumptions

1. Live NDIA submission remains **off** until partner onboarding and explicit env enablement.
2. Mock adapter is the safe default for registered-provider claiming.
3. Portal CSV upload is the operational path for NDIA-managed bulk claims today (no portal scraping; no government passwords stored).
4. Australian data residency is an infrastructure/ops concern; not enforced inside claim libraries.
5. Docs (`docs/ndia-provider-claiming.md`) instruct operators to replace placeholder API paths when NDIA issues real OpenAPI contracts — those placeholders must not be treated as certified endpoints.
6. `NDIS_AUTO_CLAIMING_ENABLED` must remain unused for autonomous submission (governance: no AI/auto submit).

---

## 16. Retain / deprecate / migrate (Wave 0 stance)

| Stance | Items |
|--------|-------|
| **Retain** | Both engines, existing routes/UI, crypto helper, portal export, SM/PM invoices, ingest scripts, readiness dry-run |
| **Deprecate (later waves)** | Dual engines as independent truth; default-to-agency funding map; plaintext claim JSON NDIS numbers; global pilot approval as claim gate; assumed NDIA path/auth |
| **Migrate** | Into `lib/ndis-gateway` with compatibility facades (Waves 1–8) |
| **Create (this wave)** | This audit set under `docs/ndis-gateway/` |

See also: [domain-map.md](./domain-map.md), [data-flow.md](./data-flow.md), [migration-map.md](./migration-map.md), [risk-register.md](./risk-register.md).

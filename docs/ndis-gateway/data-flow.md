# NDIS Gateway — Data Flow

**Wave:** 0  
**Purpose:** Document how claim, pricing, provider-directory, and identifier data move through the system today, and call out gaps that Waves 1–9 close.

---

## 1. Portal-assisted claiming (multi-route)

```mermaid
flowchart TD
  Booking[Completed Booking]
  Profile[ParticipantProfile encrypted NDIS number]
  CreateLine[createClaimLineFromBooking]
  Line[NdisClaimLine masked number]
  Validate[validateClaimLineInput]
  Batch[NdisClaimBatch]
  Export{paymentRoute}
  CSV[Portal bulk CSV]
  SmInv[SelfManaged NdisInvoice]
  PmInv[PlanManager NdisInvoice]
  MarkPortal[markBatchSubmittedInPortal]

  Booking --> CreateLine
  Profile --> CreateLine
  CreateLine --> Line
  Line --> Validate
  Validate --> Batch
  Batch --> Export
  Export -->|ndia_managed| CSV
  Export -->|self_managed| SmInv
  Export -->|plan_managed| PmInv
  CSV --> MarkPortal
```

**Entry:** `POST /api/ndis/claims/from-booking`  
**Batch:** `POST /api/ndis/claim-batches` → validate → export → optional mark-submitted  
**NDIS number:** decrypted only for create/validate; stored masked; CSV further masks.  
**NDIA HTTP:** not used on this path (`NdiaApiAdapter.stub` throws if invoked).

---

## 2. Registered-provider NDIA claiming

```mermaid
flowchart TD
  LegacyInv[Legacy Invoice]
  BillingInv[BillingInvoice]
  Build[buildClaimFrom*Invoice]
  Decrypt[decrypt NDIS number]
  Payload[NdiaProviderClaimPayload with full ndisNumber]
  Draft[NdiaProviderClaim.claimPayloadJson]
  Val[validate / dry-run]
  Gov{human approval gate}
  Submit[submitProviderClaimToNdia]
  Mock[Mock receipt]
  Http[HTTP POST placeholder path]

  LegacyInv --> Build
  BillingInv --> Build
  Build --> Decrypt
  Decrypt --> Payload
  Payload --> Draft
  Draft --> Val
  Val --> Gov
  Gov --> Submit
  Submit --> Mock
  Submit --> Http
```

**Entry:** `POST /api/provider/ndia-claims` with `legacyInvoiceId` or `billingInvoiceId`  
**Live gate:** `NDIS_CLAIM_SUBMISSION_ENABLED` + `NDIA_REAL_SUBMISSION_ENABLED` + `adapterMode=http` + `apiBaseUrl`  
**Gaps:**

- Billing invoice service period uses `createdAt` / `dueAt`; line `serviceDate` uses line `createdAt` (no service-date field on `BillingInvoiceLineItem`).
- Full NDIS number persists in `claimPayloadJson`.
- Approval is global pilot record, not claim/org/payload-hash bound; skipped when live is allowed.
- No idempotency key; mock external id uses `Date.now()`.
- Error throws may include external response bodies.
- No remittance / status polling / webhook import loop.

---

## 3. NDIS number encrypt / decrypt / mask

```mermaid
flowchart LR
  Input[Participant NDIS number input]
  Enc[encryptNdisNumber AES-256-GCM]
  Store[ParticipantProfile.ndisParticipantNumberEnc]
  Dec[decryptNdisNumber]
  Mask[maskNdisNumber ****last4]
  PortalLine[NdisClaimLine.ndisParticipantNumber masked]
  ProviderJson[claimPayloadJson full number]
  BillingFS[BillingFundingSource plaintext optional]

  Input --> Enc --> Store
  Store --> Dec
  Dec --> Mask --> PortalLine
  Dec --> ProviderJson
  Input -.-> BillingFS
```

**Key resolution:** `NDIS_ENCRYPTION_KEY` → `NEXTAUTH_SECRET` → hard-coded development fallback.  
**Wave 2 target:** generate external payload just-in-time from encrypted participant data; never store decrypted numbers in ordinary claim JSON, audit JSON, metadata, cache keys, or list responses.

---

## 4. Funding route decision today

```mermaid
flowchart TD
  FS[FundingSourceType or BillingFundingSourceType]
  PortalMap[fundingSourceToPaymentRoute]
  ProvMap[mapBillingFundingType]
  PortalRoute[NdisPaymentRoute or null]
  ProvFund[FundingSourceType incl default agency]
  PortalOut{route}
  ProvVal[validateFundingForProviderClaim]

  FS --> PortalMap --> PortalRoute
  FS --> ProvMap --> ProvFund --> ProvVal
  PortalRoute --> PortalOut
  PortalOut -->|self_managed| SmPath[Self-managed invoice]
  PortalOut -->|plan_managed| PmPath[Plan-manager invoice]
  PortalOut -->|ndia_managed| PortalCsv[Portal CSV]
  PortalOut -->|null| BlockPortal[Block / validation error]
  ProvVal -->|plan_managed / private_pay| BlockProv[Error]
  ProvVal -->|self_managed| WarnSm[Warning only]
  ProvVal -->|agency or defaulted| AllowDirect[Allow draft toward submit]
```

**Critical divergence:** portal mapping fails closed for unsupported types; provider mapping defaults many billing types to agency-managed (R1), and only warns on self-managed (R2).

---

## 5. Pricing data flow

```mermaid
flowchart TD
  SupportItem[NdisSupportItem]
  Sync[catalogue-sync]
  ClaimingCat[NdisPricingCatalogueItem unique by code]
  Versioned[NdisPriceCatalogue Version Prices]
  ImportJob[NdisPriceImportJob]
  PortalVal[Portal claim validation]
  ProviderVal[Provider claim validation]

  SupportItem --> Sync --> ClaimingCat
  ImportJob --> Versioned
  SupportItem --> Versioned
  ClaimingCat --> PortalVal
  SupportItem --> PortalVal
  SupportItem --> ProviderVal
```

**Gap:** claiming path uses mutable unique-by-code catalogue (`NdisPricingCatalogueItem`), not the versioned catalogue. Historical service dates cannot safely resolve against multiple releases. Provider validation does not use claiming catalogue and treats unknown items as warnings.

---

## 6. Provider directory ingestion

```mermaid
flowchart TD
  PublicJson[Public NDIS list-providers JSON]
  Fetch[fetch-ndis-list-providers.ts]
  Local[data/ndis/list-providers.json]
  Seed[seed-ndis-provider-outlets.ts]
  Outlets[ProviderOutletRegistry]
  Ingest[ingest-ndis-providers.ts]
  Providers[NdisProvider + IngestionRun]
  Supabase[import-provider-outlets-supabase.ts]
  SupaTable[Supabase provider_outlets]
  MapUI[Provider listing / map components]

  PublicJson --> Fetch --> Local
  Local --> Seed --> Outlets
  Local --> Ingest --> Providers
  PublicJson --> Supabase --> SupaTable
  Outlets --> MapUI
  Providers --> MapUI
```

**Ops note:** ingestion is scheduled / admin-triggered; user requests must not call undocumented government endpoints. Stale-data warnings and release diffs are Wave 6 work.

---

## 7. Readiness / evidence (legacy adjacent path)

```mermaid
flowchart LR
  Invoice[Legacy Invoice]
  Bundle[NdiaClaimEvidenceBundle]
  DryRun[runNdiaDryRun]
  Export[exportEvidenceBundle JSON]
  Block{real submission enabled?}

  Invoice --> Bundle
  Bundle --> DryRun
  Bundle --> Export
  DryRun --> Block
  Block -->|yes| Throw[Throw — safety]
  Block -->|no| LocalOnly[Local dry-run only]
```

Explicitly **not** submitted to NDIA. Pilot service can record blocked dry-runs.

---

## 8. Billing vs NDIS claiming

| Flow | Module | External money movement |
|------|--------|-------------------------|
| Self-managed / private_card checkout | `lib/billing-core` Stripe | Card payment |
| Plan-managed export | billing export / NDIS PM invoice | Plan manager pays outside MapAble |
| Portal NDIA-managed CSV | claiming portal export | Manual myplace upload by human |
| Registered-provider claim | ndia-provider-claiming | Mock or future partner API |
| Xero sync | billing / invoice status flags | Accounting mirror — not claim source of truth |

Wave 7 will emit accounting events for Xero without making Xero the claim authority.

---

## 9. Reconciliation gap (current)

```mermaid
flowchart LR
  Submitted[Claim submitted / exported]
  StatusUI[Reconciliation UI page]
  Remittance[Remittance / response file]
  Events[External status events]

  Submitted --> StatusUI
  Remittance -.->|missing| Events
  Events -.->|missing| StatusUI
```

There is a provider console reconciliation page, but no complete import/polling/webhook path that:

- stores append-only external events,
- maps adapter statuses to canonical statuses,
- reconciles requested / accepted / rejected / paid line-by-line,
- prevents duplicate payment posting.

This is Wave 7.

---

## 10. Target gateway flow (post Wave 7 — reference only)

```mermaid
flowchart TD
  Source[Booking / Shift / Timesheet / Invoice]
  Build[build-claim]
  Snap[NdisClaimSnapshot masked + encrypted]
  Val[validate-claim]
  Approve[approve-claim snapshot hash]
  Adapter[Selected NdisClaimSubmissionAdapter]
  Sub[NdisExternalSubmission]
  ExtEvt[NdisExternalEvent append-only]
  Recon[reconcile-claim]
  Audit[Immutable audit writer]

  Source --> Build --> Snap --> Val --> Approve --> Adapter
  Adapter --> Sub --> ExtEvt --> Recon
  Build --> Audit
  Val --> Audit
  Approve --> Audit
  Sub --> Audit
  Recon --> Audit
```

Wave 0 does not implement this path; it is the migration north star documented in [migration-map.md](./migration-map.md).

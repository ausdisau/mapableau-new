# NDIS Gateway — Domain Map

**Wave:** 0  
**Purpose:** Map current NDIS concepts onto the canonical `lib/ndis-gateway` domain planned for Waves 1–9. No runtime code in this wave.

---

## 1. Target package layout

```text
lib/ndis-gateway/
├── domain/
│   ├── claim.ts
│   ├── claim-status.ts
│   ├── funding-route.ts
│   ├── pricing.ts
│   ├── provider.ts
│   ├── remittance.ts
│   ├── evidence.ts
│   └── errors.ts
├── application/
│   ├── build-claim.ts
│   ├── validate-claim.ts
│   ├── approve-claim.ts
│   ├── submit-claim.ts
│   ├── reconcile-claim.ts
│   ├── correct-claim.ts
│   ├── import-pricing-release.ts
│   └── import-provider-release.ts
├── adapters/
│   ├── contracts.ts
│   ├── mock-ndia-adapter.ts
│   ├── ndia-digital-partner-adapter.ts
│   ├── aggregator-adapter.ts
│   ├── portal-bulk-upload-adapter.ts
│   ├── plan-manager-invoice-adapter.ts
│   ├── self-managed-invoice-adapter.ts
│   └── manual-claim-adapter.ts
├── infrastructure/
│   ├── claim-repository.ts
│   ├── encrypted-payload-store.ts
│   ├── idempotency-store.ts
│   ├── audit-writer.ts
│   ├── retry-policy.ts
│   ├── correlation.ts
│   └── redaction.ts
├── security/
│   ├── permissions.ts
│   ├── claim-approval-policy.ts
│   ├── sensitive-fields.ts
│   └── log-sanitiser.ts
├── schemas/
│   ├── claim.schema.ts
│   ├── external-event.schema.ts
│   ├── pricing-release.schema.ts
│   └── provider-release.schema.ts
└── index.ts
```

Existing modules stay as **compatibility facades** until routes and UI are cut over.

---

## 2. Concept mapping

| Current concept | Canonical target | Notes |
|-----------------|------------------|-------|
| `NdisPaymentRoute` | `FundingRoute` | Add `private_pay`, `unknown` |
| `FundingSourceType` | `FundingRoute` via mapper | Never map unknown → ndia_managed |
| `BillingFundingSourceType` | `FundingRoute` via mapper | `private_card` → `private_pay`; never agency |
| `NdisClaimLine` + batch | `CanonicalNdisClaim` (+ batch grouping) | Snapshot before submit |
| `NdiaProviderClaim` | `CanonicalNdisClaim` sourceType `invoice` | Encrypted snapshot replaces `claimPayloadJson` |
| `NdisClaimLineStatus` / `NdiaProviderClaimStatus` / batch status | Unified claim status machine | Wave 7 |
| `NdisClaimingAdapter` | `NdisClaimSubmissionAdapter` | Shared contract |
| `ndia-api-client` mock/http | `MockNdiaAdapter` + `NdiaDigitalPartnerAdapter` | Direct API disabled until technical pack |
| Portal / SM / PM adapters | Same kind names under gateway adapters | Retain behaviour |
| `NdisPricingCatalogueItem` | Compatibility view over active `NdisPricingRelease` | Wave 3 |
| `NdisPriceCatalogue*` | Feed into release/rule models | Preserve history |
| `NdisSupportItem` | Pricing rule + catalogue identity | Effective-dated |
| `ProviderOutletRegistry` / `NdisProvider` | `NdisProviderDatasetRelease` + snapshots | Wave 6 |
| `ClaimAuditEvent` / `NdiaProviderClaimAudit` / `AuditEvent` | Gateway `audit-writer` + append-only events | Material transitions |
| `NdiaPilotApprovalRecord` | `NdisClaimApproval` (claim + org + payload hash) | Replace global pilot gate |
| Encrypted profile NDIS number | Encrypted payload store + masked relational fields | Wave 2 |

---

## 3. Canonical funding routes

```ts
type FundingRoute =
  | "self_managed"
  | "plan_managed"
  | "ndia_managed"
  | "private_pay"
  | "unknown";
```

### Mapping rules (Wave 1 — must not silently fall through)

| Source value | Canonical route |
|--------------|-----------------|
| `ndis_self_managed` | `self_managed` |
| `ndis_plan_managed` | `plan_managed` |
| `ndis_agency_managed` | `ndia_managed` |
| `private_pay` / `private_card` | `private_pay` |
| `aged_care`, `employer`, `organisation_invoice`, `grant`, `other`, null, missing | `unknown` |

**Hard rule:** never map `private_pay` / `unknown` to `ndia_managed`.

Current defect: `mapBillingFundingType` defaults unsupported billing types to `ndis_agency_managed` (see [risk-register.md](./risk-register.md) R1).

---

## 4. `resolveClaimPath`

Pure function (Wave 1):

```ts
resolveClaimPath(
  fundingRoute: FundingRoute,
  providerRegistration: ProviderRegistrationContext,
  participantContext: ParticipantClaimContext
): ClaimPathDecision
```

### Expected outcomes

| Funding route | Registration | Path |
|---------------|--------------|------|
| `ndia_managed` | Registered provider active | `ndia_direct` **or** `approved_aggregator` **or** `portal_export` **or** `manual_claim` (feature-flagged; live requires approval) |
| `ndia_managed` | Unregistered / inactive | **Block** |
| `plan_managed` | any | `plan_manager_invoice` only |
| `self_managed` | any | `self_managed_invoice` only |
| `private_pay` | any | Ordinary billing only (no NDIS submission) |
| `unknown` | any | **Block**; request human correction |

Compatibility facade: existing routes call the resolver without changing public response shapes until Wave 7.

---

## 5. Adapter contract (target)

```ts
export interface NdisClaimSubmissionAdapter {
  readonly kind:
    | "mock"
    | "ndia_direct"
    | "approved_aggregator"
    | "portal_export"
    | "plan_manager_invoice"
    | "self_managed_invoice"
    | "manual_claim";
  getReadiness(): Promise<AdapterReadiness>;
  prepare(
    claim: CanonicalNdisClaim,
    context: SubmissionContext
  ): Promise<PreparedSubmission>;
  submit(
    prepared: PreparedSubmission,
    context: SubmissionContext
  ): Promise<SubmissionReceipt>;
  getStatus?(
    externalReference: string,
    context: SubmissionContext
  ): Promise<ExternalClaimStatus>;
  importResponse?(
    input: ExternalResponseInput,
    context: SubmissionContext
  ): Promise<ExternalClaimEvent[]>;
}
```

| Current code | Maps to kind |
|--------------|--------------|
| Mock branch in `ndia-api-client.ts` | `mock` |
| HTTP branch (scaffold) | `ndia_direct` (disabled until technical pack) |
| — | `approved_aggregator` (new) |
| `PortalExportAdapter` + CSV exporter | `portal_export` |
| `PlanManagerInvoiceAdapter` | `plan_manager_invoice` |
| `SelfManagedInvoiceAdapter` | `self_managed_invoice` |
| — | `manual_claim` (new) |
| `NdiaApiAdapter.stub` | Retained until portal engine delegates to gateway |

---

## 6. Canonical claim status (Wave 7 target)

**Happy path:**  
`draft` → `validation_failed` | `validated` → `awaiting_approval` → `approved` → `preparing` → `submission_pending` → `submitted` → `acknowledgement_received` → `processing` → `accepted` → `partially_paid` → `paid`

**Exception paths:**  
`rejected`, `on_hold`, `needs_information`, `submission_unknown`, `correction_required`, `corrected`, `resubmission_pending`, `voided`, `closed`

Current dual enums remain until the state machine ships; unknown external statuses must be preserved (never coerced to rejected/paid).

---

## 7. Privacy and approval domain objects (Wave 2)

| Model | Purpose |
|-------|---------|
| `NdisClaimSnapshot` | Masked JSON + encrypted ciphertext; payload hash |
| `NdisClaimApproval` | Decision bound to claim, org, snapshot hash, expiry |
| `NdisExternalSubmission` | Adapter kind, idempotency key, correlation id |
| `NdisExternalEvent` | Append-only external status / remittance events |

Approval must be claim-specific, organisation-specific, and payload-hash-specific. Global `NdiaPilotApprovalRecord` is not a substitute.

---

## 8. Pricing domain (Wave 3)

| Model | Purpose |
|-------|---------|
| `NdisPricingRelease` | Versioned import with effective dates, source hash, status |
| `NdisPricingRule` | Composite uniqueness (item, unit, region, day, time, context, …) |

Claims validate against the release effective on the **service date**. Fail closed when no rule matches. Do not infer caps from similarly named items.

---

## 9. Provider directory domain (Wave 6)

| Model | Purpose |
|-------|---------|
| `NdisProviderDatasetRelease` | Source hash, data-as-at, parser version, counts |
| `NdisRegisteredProviderSnapshot` | Per-release provider/outlet snapshot |

Distinguish: public registration listing ≠ current capacity ≠ MapAble verification ≠ MapAble endorsement.

---

## 10. Errors and validation findings

Target machine-readable result (Wave 4):

```json
{
  "valid": false,
  "blocking": true,
  "rulesetVersion": "...",
  "pricingReleaseId": "...",
  "findings": [
    {
      "code": "NDIS_PRICE_ABOVE_LIMIT",
      "severity": "error",
      "field": "lines[0].unitPriceCents",
      "plainLanguageMessage": "...",
      "technicalMessage": "...",
      "sourceReference": "..."
    }
  ]
}
```

Current shapes (`ClaimValidationIssue`, `ClaimValidationFinding`) map into this via adapters; messages must remain accessible and actionable.

---

## 11. Security domain

| Concern | Current | Canonical |
|---------|---------|-----------|
| Permissions | `provider:ndis:claim`, `provider:ndia:claim` | Gateway permissions + existing facades |
| Approval | Global pilot record | `claim-approval-policy` |
| Sensitive fields | Ad hoc | `sensitive-fields` + `log-sanitiser` |
| Correlation | Mostly absent | `correlation` IDs on all external calls |
| Idempotency | Incomplete | `idempotency-store` |

---

## 12. Explicit non-goals of the domain

- Do not invent private NDIA endpoint paths, auth flows, or schemas.
- Do not scrape government portals or store portal passwords.
- Do not allow AI or automation to submit/alter/resubmit claims.
- Do not build a third independent claim engine alongside the two existing ones.

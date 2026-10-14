# NDIS Gateway — Migration Map

**Wave:** 0  
**Purpose:** For every current NDIS module, name its destination, compatibility strategy, owning wave, and rollback approach.  
**Hard rule:** Do **not** delete `lib/ndis/claiming` or `lib/ndia-provider-claiming` during early waves. Do **not** build a third independent claim engine.

---

## 1. Strategy summary

1. Create `lib/ndis-gateway` as the canonical domain/application layer.
2. Keep existing public routes and screens working via **facades** and **wrapper routes**.
3. Migrate persistence and adapters in isolated PRs (privacy ≠ adapters ≠ UI).
4. Mark legacy endpoints deprecated (headers + docs) only after new `/api/provider/ndis/**` exists (Wave 7).
5. Roll back by feature flag and by reverting the wave PR; forward-only Prisma migrations need compensating migrations, not silent deletes.

---

## 2. Module migration table

| Existing module | Destination | Wave | Compatibility strategy | Rollback |
|-----------------|-------------|------|------------------------|----------|
| `lib/ndis/claiming/paymentRoute.ts` | `lib/ndis-gateway/domain/funding-route.ts` + facade | 1 | Re-export / delegate to `resolveClaimPath`; preserve function names where callers exist | Revert Wave 1; old mapping remains until facade removed |
| `lib/ndia-provider-claiming/validate.ts` `mapBillingFundingType` | Same funding-route mapper | 1 | Facade returns corrected semantics; public API shape unchanged | Flag or revert; add regression for `private_card` |
| `lib/ndis/claiming/types.ts` + provider `types.ts` | `domain/claim.ts`, `claim-status.ts`, `errors.ts` | 1 | Mappers both directions; Zod at gateway boundary | Leave dual types until Wave 4+ |
| New package (none today) | `lib/ndis-gateway/**` | 1 | New code only; no route cutover required | Delete package / revert PR |
| `ParticipantProfile` crypto usage | `infrastructure/encrypted-payload-store.ts` | 2 | Keep `lib/crypto/ndis.ts`; gateway wraps it | Keep encrypted column; disable snapshot writes |
| `NdiaProviderClaim.claimPayloadJson` | `NdisClaimSnapshot` masked + ciphertext | 2 | Backfill masked snapshots; mark privacy-review rows; keep original rows | Stop writing snapshots; old JSON still readable for admin review |
| `NdiaPilotApprovalRecord` as submit gate | `NdisClaimApproval` | 2 | Submit path checks claim/org/hash approval; pilot record may remain for pilot UI only | Fall back to “live disabled” |
| New submission/event models | `NdisExternalSubmission`, `NdisExternalEvent` | 2 | Unused until Wave 5/7 | Drop via compensating migration if needed |
| `NdisPricingCatalogueItem` | Compatibility view over active `NdisPricingRelease` | 3 | Claiming validation reads view; unique-by-code table becomes projection | Keep writing unique catalogue until view proven |
| `NdisPriceCatalogue*` / import jobs | Feed `import-pricing-release` | 3 | Admin import preview + activate; CLI `pnpm ndis:pricing:*` | Reject new release; prior active release remains |
| `lib/ndis-pricing/catalogue-import-service.ts` | `application/import-pricing-release.ts` | 3 | Service delegates; route `/api/ndis/pricing/import` wraps | Revert service changes |
| `lib/ndis/claiming/validation.ts` | `application/validate-claim.ts` | 4 | Portal validate APIs call gateway; response mapped to old issue shape | Facade bypass via flag |
| `lib/ndis/claiming/claim-service.ts` | `application/build-claim.ts` (+ existing batch helpers) | 4 | Booking/source builders produce canonical snapshot then map to line | Keep direct line create behind flag |
| `lib/ndia-provider-claiming/build-claim.ts` | Same builder with invoice sources | 4 | Invoice path → snapshot; no submit from raw invoice | Old builders remain callable |
| Duplicate org-access / funding / price checks | Single rules engine | 4 | Both engines call shared findings | Split again only via revert |
| `lib/ndia-provider-claiming/ndia-api-client.ts` | Adapters under `lib/ndis-gateway/adapters/` | 5 | Client becomes scaffold behind `NdiaDigitalPartnerAdapter` (disabled); mock adapter first | `NDIS_LIVE_SUBMISSION_ENABLED=false` |
| Portal / SM / PM adapters | Gateway adapter kinds | 5 | Thin wrappers around existing adapter classes | Call old adapters directly |
| — (new) | `aggregator-adapter`, `manual-claim-adapter` | 5 | Feature-flagged; no vendor assumed | Flags off |
| Feature flags (current NDIA_*) | Gateway flags (`NDIS_GATEWAY_*` etc.) | 5 | Read both during transition; live requires all gates | Disable gateway / live flags |
| `scripts/fetch-ndis-list-providers.ts` | Writes `NdisProviderDatasetRelease` | 6 | Scripts gain release write; keep outlet upsert | Ignore release tables |
| `scripts/ingest-ndis-providers.ts` | Same | 6 | Quarantine malformed; provenance fields | Prior `NdisProvider` rows remain |
| `scripts/import-provider-outlets-supabase.ts` | Optional dual-write | 6 | Document Supabase as secondary store | Stop dual-write |
| `prisma/seed-ndis-provider-outlets.ts` | Seed into release + outlets | 6 | Dev/demo only | Re-seed outlets |
| Provider map UI | Stale warnings + a11y markers | 6 | Additive UI | Hide warnings |
| `/api/ndis/**` claim routes | Wrappers → gateway | 7 | Deprecation headers; same JSON shapes | Remove wrappers / point back to old services |
| `/api/provider/ndia-claims/**` | Wrappers → gateway | 7 | Same | Same |
| New REST surface | `/api/provider/ndis/**` | 7 | New canonical API | Disable routes via flag |
| Reconciliation UI (thin) | Import + exception queues | 7 | Wire to external events | Disable import endpoint |
| `/provider/ndis-claims/*` + `/provider/ndia-claims` | `/provider/ndis` control centre | 8 | Redirects from old paths | Redirect reverse |
| `/provider/claiming` hub | Points to consolidated nav | 8 | Update links | Restore dual links |
| `docs/ndia-provider-claiming.md` | Point to gateway docs | 9 | Keep as legacy pointer | N/A |
| — | `docs/ndis-gateway/readiness/**` | 9 | New certification pack | Docs-only revert |
| CI / release gates | Workflow checks listed in Wave 9 | 9 | Additive checks | Soften required checks |

---

## 3. Route migration detail

### Keep as compatibility wrappers (Wave 7)

| Legacy route family | Wrapper behaviour |
|---------------------|-------------------|
| `/api/ndis/claims/*`, `/api/ndis/claim-batches/*`, `/api/ndis/claim-lines/*` | Call gateway application services; map to existing response DTOs; add `Deprecation` / `Sunset` headers when new API is live |
| `/api/provider/ndia-claims/*` | Same; submit path uses gateway adapters + approval policy |
| `/api/ndis/pricing/import` | Preview/activate via release workflow |
| Admin readiness / pilot | Remain admin tools; do not authorise live claim submit |

### New canonical routes (Wave 7)

`GET/POST /api/provider/ndis/claims`, claim sub-resources (`validate`, `approve`, `revoke-approval`, `dry-run`, `submit`, `correct`, `void`), submissions, reconciliation import, exceptions, audit — as specified in the implementation pack.

---

## 4. Data migration notes

| Wave | Data change | Compatibility | Rollback |
|------|-------------|---------------|----------|
| 2 | Add snapshot / approval / submission / event tables; backfill masked snapshots | Old claim rows preserved; privacy-review flag for incomplete backfill | Stop writing new tables; do not delete evidence |
| 3 | Add pricing release/rule tables; project active release to catalogue view | Historical claims keep service-date resolution via releases | Supersede bad release; re-activate prior |
| 6 | Provider dataset releases + snapshots | Prior outlet/`NdisProvider` rows kept | Quarantine bad release |
| 7 | Status mapping + remittance events | Dual-write status to legacy enums during transition | Ignore new event tables |

**Never** silently delete claim evidence, invoices, or audit rows during backfill.

---

## 5. Feature-flag transition

| Phase | Flags |
|-------|-------|
| Today | `NDIS_CLAIM_SUBMISSION_ENABLED`, `NDIA_REAL_SUBMISSION_ENABLED`, `NDIA_PROVIDER_*`, readiness/pricing/delivery/pilot |
| Wave 5+ | Add `NDIS_GATEWAY_ENABLED`, `NDIS_DIRECT_API_ENABLED`, `NDIS_AGGREGATOR_ENABLED`, `NDIS_PORTAL_EXPORT_ENABLED`, `NDIS_MANUAL_CLAIM_ENABLED`, `NDIS_LIVE_SUBMISSION_ENABLED`, `NDIS_REQUIRE_HUMAN_APPROVAL`, `NDIS_ADAPTER_KIND` |
| Cutover | Gateway reads new flags; legacy flags kept as aliases until Wave 9 |

Live submission always requires: gateway on, adapter ready, live on, validation passed, exact snapshot approved, actor permission, org readiness, active pricing release, idempotency acquired, audit writer available.

---

## 6. PR sequence (one draft PR per wave)

| PR | Branch theme | Contents |
|----|--------------|----------|
| 1 | `docs/ndis-gateway-audit` (this wave) | Docs only |
| 2 | `feat/ndis-canonical-domain` | Wave 1 domain + facades + tests |
| 3 | `feat/ndis-private-claim-storage` | Wave 2 privacy + approval |
| 4 | `feat/ndis-versioned-pricing` | Wave 3 pricing releases |
| 5 | `feat/ndis-unified-validation` | Wave 4 builder/rules |
| 6 | `feat/ndis-adapter-sandbox` | Wave 5 adapters |
| 7 | `feat/ndis-provider-data-releases` | Wave 6 provider data |
| 8 | `feat/ndis-submission-reconciliation` | Wave 7 lifecycle APIs |
| 9 | `feat/ndis-provider-control-centre` | Wave 8 UI |
| 10 | `docs/ndis-digital-partner-readiness` | Wave 9 readiness pack |

Do not combine privacy migration, external submission adapters, and provider UI in one PR.

---

## 7. Acceptance for this map

- Every NDIS module from [current-state-audit.md](./current-state-audit.md) appears above.
- Every proposed replacement names a compatibility strategy.
- Early waves explicitly retain both existing claim modules as facades over the gateway.

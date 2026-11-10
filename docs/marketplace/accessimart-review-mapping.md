# AccessiMart → MapAble review mapping

**Status:** review-only · default-OFF · no commerce · no live ingestion  
**Source pin:** `d6b0dc7891e92b5063252f015d4eb02fa667bde9` (AccessiMart.zip, 2026-05-30 UTC)  
**Declared licence:** MIT in root `package.json` (no LICENSE file in export)  
**MapAble flags:** `MAPABLE_ACCESSIMART_REVIEW_ENABLED`, `MAPABLE_ACCESSIMART_REVIEW_TESTER_IDS`

## Field map

| AccessiMart source | MapAble review representation |
| --- | --- |
| `products.id` / `slug` | Preserved as `sourceId` / `slug` |
| `name`, `description`, `condition`, category | Catalogue display + filters |
| `accessNeed`, `intendedUse`, `setupComplexity`, `supportCategory` | Seller-stated access metadata |
| `safetyNotes`, `clinicalReviewRecommended`, `tgaArtgStatus` | Safety claims; never independently verified |
| `warrantyPeriod`, supplier `warrantyPolicy` / `repairPolicy` | Warranty/repair claims; `assurance.warranty = not-verified` |
| Quote schema (`requesterType`, contact fields, etc.) | Documented only; `quoteSubmissionAvailable: false` |
| Supplier `legalName` / `abn` / contact / regions / `verificationStatus` | Organisation-shaped *claims*; contact withheld; seed `verified` discarded |
| `price`, stock, dropshipping, external feeds | Excluded from purchasable surfaces (`illustrativePriceShown: false`) |
| `inspectionDate` / seed timestamps | Carried as `lastVerifiedAt` with `evidenceStatus` synthetic/unverified |

## Domain alignment (no duplicate SoT)

- Supplier claims map conceptually onto existing Prisma `Organisation` fields (`name`, `abn`, `website`, `serviceRegions`, `verificationStatus`) without writing Organisation rows in this tranche.
- Identity, consent and audit remain MapAble Core (`User`, `ConsentRecord`, `AuditEvent`).
- No Prisma product/supplier catalogue migrations in this tranche.

## Excluded AccessiMart surfaces

See `ACCESSIMART_EXCLUDED_SURFACES` in `lib/marketplace/accessimart-provenance.ts` (open admin, in-memory cart, fake orders, quote PII lists, dropship, Amazon/AliExpress feeds, payment stubs, `maximum-scale=1`).

## Reconciliation with MapAble PR #10

Canonical MapAble PR #10 owns `/marketplace/alpha/**` and `MAPABLE_MARKETPLACE_ALPHA_*`. This tranche uses a separate path (`/marketplace/accessimart-review`), separate flags, and does not modify PR #10.

## Rollback

1. Keep or set `MAPABLE_ACCESSIMART_REVIEW_ENABLED=false` (route returns 404 for non-admins/non-allowlisted; layout denies).
2. Revert the feature commits if needed.
3. No database migrations to undo.

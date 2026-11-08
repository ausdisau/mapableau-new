# Ads Manager P0 evidence ledger

**Checked:** 2026-11-08 (Australia/Sydney)  
**Base SHA:** `c4e5a777e1e279ea8e749bd5619e1cd50ca45f62` (`main`)  
**Scope:** Prompt 0 discovery against MapAble Ads Manager Blueprint v1.2

## Verified facts

| Capability | Status | Evidence |
|------------|--------|----------|
| Stack | Verified | pnpm workspace, Next.js 15.5, Prisma 6, NextAuth JWT |
| Owned inventory serve | Verified (flag-off) | `lib/ads/` auction, placement registry, sponsored UI |
| Prepaid wallet + Stripe top-up | Verified (flag-off) | `lib/ads/billing/*`, `AdWallet*` models |
| Manager draft create | Verified | `app/api/ads/manager/campaigns` |
| Org-scoped advertiser access | Verified | `lib/ads/auth/advertiser-access.ts` |
| Privacy sanitisation | Verified | `lib/ads/privacy/*` |
| Kill switch / flags | Verified | `lib/ads/config/flags.ts` — all fail-closed |
| Audit helper | Verified | `lib/audit/audit-event-service.ts` |
| Event outbox | Verified | `lib/platform/event-outbox-service.ts` |
| A11y CI | Verified | `.github/workflows/accessibility.yml`, Playwright+axe |

## Gaps vs blueprint (this phase addresses subset)

| FR / area | Gap before this work | Plan coverage |
|-----------|----------------------|---------------|
| FR-02 spend:approve | No dedicated Ads spend permission | P1 RBAC |
| FR-03 channel availability states | Serve adapters only (internal/GAM/EthicalAds) | Placement API + demo DOOH |
| FR-04 channel allocations | Budget micros on campaign only | Allocation domain |
| FR-06 extended lifecycle | `AdEntityStatus` serve subset | Additive manager lifecycle |
| FR-08 external order idempotency | Impression/click only | Placement orders |
| §14 APIs.io discovery | Absent | Vertical slice catalog sync |
| §14 placement OpenAPI | Design-only upload | Checked in + `/api/ads/v1` |
| Social/Meta/Google Ads buying | Absent | Out of scope (mock later) |
| Live DOOH | Absent | Synthetic sandbox only |
| Placement spend auth ≠ wallet top-up | Absent | Mock authorisation record |

## Dependency map

```text
NextAuth User
  → OrganisationMember
    → Organisation
      → AdAdvertiser
        → AdCampaign (+ lifecycleStatus, allocations)
        → AdCreative / AdPolicyReview
        → AdWallet (micros; existing serve billing)
        → AdPlacementQuote / AdSpendAuthorisation / AdPlacementOrder (cents; new)
AdProviderCatalogEntry (research only; never buyable by itself)
```

## Non-claims

- No production Ads Manager UI was live-verified.
- No Meta/Google Ads/TikTok/LinkedIn/DOOH partner credentials exist in-repo.
- Public vendor docs and APIs.io listings are **not** MapAble entitlements.

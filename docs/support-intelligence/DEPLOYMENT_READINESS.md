# Support Intelligence v0.1 — Deployment Readiness Report

**Date:** 28 November 2026 (Australia/Sydney)  
**Verdict:** **NOT READY for production enablement.** Preview / CI / controlled sandbox only.

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Feature flags default off | PASS | `lib/support-intelligence/config/feature-flags.ts` |
| Booking / payment / dispatch hard-denied | PASS | `hardDenyOperationalActions()` ignores env |
| No parallel provider DB | PASS | Spider reuses `ndis_providers` / fixtures |
| No worker-screening crawl | PASS | Allowlist blocks screening hosts; WVG consent-gated |
| No invented registration claims | PASS | REG always returns `unknown`/`conflict`/`declared` directory only |
| No AI NDIS eligibility/funding | PASS | SNA labelled `officialAssessment: false` |
| Human review for conflicts / ambiguity / complex support | PASS | `enqueueHumanReview` + REG/WVG/SMA paths |
| Public index excludes participant/worker private data | PASS | `support_intel_public_provider_index` view |
| Distributed rate limiting verified | FAIL | Upstash optional; process-local fallback documented |
| Live Commission / NWSD connectors | FAIL | Not authorised; official links only |
| PostGIS / pgvector | CONDITIONAL | Migration enables if extension available |
| WCAG 2.2 AA disability-led verification | NOT RUN | Disclaimer component + keyboard focus styles shipped; human a11y pending |
| Digital platform registration determination | OWNER_ACTION_REQUIRED | Blocks transaction lanes |

## Rollback procedure

1. Unset all `MAPABLE_SUPPORT_INTEL_*` env vars (or set `MAPABLE_SUPPORT_INTEL_KILL_SWITCH=true`).
2. Confirm `GET /api/support-intelligence/status` reports `live: false`.
3. Do **not** drop migration tables — preserve audit/evidence/review rows.
4. Revert application deploy to prior git SHA if code regression.
5. Leave `MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED` unchanged unless independently approved.

## Recommended preview env

```
MAPABLE_SUPPORT_INTEL_ENABLED=false
MAPABLE_SUPPORT_INTEL_KILL_SWITCH=false
MAPABLE_SUPPORT_INTEL_SPIDER_ENABLED=false
MAPABLE_SUPPORT_INTEL_SPIDER_CRAWL_ENABLED=false
MAPABLE_SUPPORT_INTEL_SNA_ENABLED=false
MAPABLE_SUPPORT_INTEL_SMA_ENABLED=false
MAPABLE_SUPPORT_INTEL_REG_GATEWAY_ENABLED=false
MAPABLE_SUPPORT_INTEL_WVG_ENABLED=false
MAPABLE_SUPPORT_INTEL_DEMAND_ENABLED=false
MAPABLE_SUPPORT_INTEL_SEARCH_ENABLED=false
```

## Validation commands

```sh
pnpm exec vitest run tests/support-intelligence/acceptance.test.ts
pnpm type-check
pnpm lint:lib
```

## Commercial ranking

SMA ranking uses eligibility then preference overlap only. No paid boost fields exist on the organic path. Ads remain separately labelled via existing MapAble Search ad slots.

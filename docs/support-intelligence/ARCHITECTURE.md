# MapAble Support Intelligence v0.1 — Architecture

**Status:** Preview / fail-closed. Booking, payment and autonomous dispatch remain disabled.  
**Date:** 28 November 2026 (Australia/Sydney)

## 1. Inspection baseline (reuse boundaries)

| Domain | Canonical location | Reuse rule |
|--------|-------------------|------------|
| MapAble Search | `lib/search/*`, `app/api/mapable-search`, `/search` | Extend hit contracts; do not invent parallel public indexes |
| Provider directory | `NdisProvider`, `ProviderOutletRegistry`, `lib/ingestion/ndis-providers.ts` | Single provider store; Spider upserts into these entities |
| Provider profiles | `ProviderProfile` / `ProviderProfileService` | Verified searchable profiles only when `isSearchVisible` |
| SNA | `lib/intake/support-needs-assessor.ts`, `ICanV6IntakeSubmission` | Participant-directed self-report; never NDIA eligibility |
| Matching | `lib/matching/*`, `lib/ai/matching/*` | Eligibility gates before preference ranking |
| Regulatory honesty | `lib/provider/finder/evidence.ts` | Directory activity ≠ registration ≠ worker clearance |
| Consent | `lib/consent/consent-service.ts`, `ConsentRecord` | Purpose-scoped; withdrawal audited |
| AD.iD / MapAbleID | `docs/decisions/ADR-mapableid-v03-identity-authority.md` | Federation remains disabled; identity stays on AU Neon |
| Relational Fit Engine | `lib/ai/relational/*`, Relational Constitution v0.1 | Honesty assertions; no prohibited inference |
| Audit | `AuditEvent` via `lib/audit/audit-event-service.ts` | All SI mutations emit audit actions |
| Connector Gateway | `lib/ai/platform/connector-gateway/*` | External connectors go through governed gateway patterns |

**Do not create:** a second provider database, public worker-screening crawl paths, AI NDIS eligibility determination, or commercial ranking influence over organic SMA scores.

## 2. Component map

```text
/search + /api/support-intelligence/*
              │
   Support Intelligence Facade (lib/support-intelligence)
              │
   ┌──────────┼──────────┬─────────────┬──────────────┐
   │          │          │             │              │
 Spider      SNA        SMA      REG Gateway    WVG Gateway
   │          │          │             │              │
 Source     Intake    Eligibility   Public        Authorised
 adapters   snapshots  then prefs   register      screening
 + Crawlee              + explain   + enforcement  workflows
   │                                 human review   human review
   └──────────┬──────────────────────┴──────────────┘
              │
   Canonical Prisma entities (ndis_providers, outlets, Match*, Consent*, Audit*)
              │
   Support Demand Intelligence (aggregate-only, small-cell suppressed)
```

## 3. Data classification

| Class | Examples | Index / storage |
|-------|----------|-----------------|
| Public | Outlet name, suburb, imported services, directory activity | Postgres FTS (`ndis_providers`); never worker IDs |
| Participant-private | SNA answers, preferences, exact addresses | Consent-gated tables; excluded from public search index |
| Worker-restricted | Screening status, credentials | Authorised WVG workflows only |
| Aggregate | Regional unmet-need counts | Privacy-preserving; k-anonymity / small-cell suppression |

## 4. Mandatory gates (SMA)

1. Feature flag on (`MAPABLE_SUPPORT_INTEL_*`)
2. Consent valid for matching purpose (not withdrawn)
3. Organisation / outlet eligibility hard gates
4. Regulatory conflict → human review queue (no auto-rank boost)
5. Preference / Relational Fit ranking **only after** eligibility passes
6. Every candidate returns evidence + explicit `unknown` fields
7. Booking / payment / dispatch actions remain permanently denied in v0.1

## 5. Spider policy

- API-first: NDIS list-providers JSON and other licensed APIs before crawl
- Crawlee only for reviewed host allowlist + robots.txt compliance
- No CAPTCHA bypass, no auth walls, no screening-database crawl
- Provenance: `sourceUrl`, `retrievedAt`, `rawHash`, `licenseAndReuse`
- Pagination, Zod validation, cache TTL, distributed rate limit when Upstash configured (else process-local + fail-closed for sensitive ops)

## 6. Rollback

1. Unset all `MAPABLE_SUPPORT_INTEL_*` and Spider/REG/WVG flags (defaults false)
2. Leave migrations applied (forward-only); tables unused when flags off
3. Do not delete audit / review-queue / evidence rows
4. Revert PR branch if code regression; see `DEPLOYMENT_READINESS.md`

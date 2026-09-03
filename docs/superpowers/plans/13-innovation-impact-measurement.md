# Prompt 13 — Innovation Impact Measurement

## Objective

Implement MapAble Innovation impact measurement across journey outcomes, data quality, consumer experience, enterprise adoption, mission & equity, privacy & security, research translation, and commercialisation — without using engagement metrics alone as social impact evidence.

## Non-goals

- Combining research and marketing datasets by shared ID
- Sending sensitive/research metrics to PostHog
- Engagement-only impact claims

## Prerequisites

- Prompt 10 merged (VAJSR metric)
- Prompt 11–12 merged (enterprise usage data)
- Prompt 08 merged (analytics lane separation)
- Portfolio epic: [E14 Access Observatory](../innovation/epics/14-access-observatory.md)

## North-star metric

**Verified Accessible Journey Success Rate (VAJSR)** — from Prompt 10

## Metric domains

| Domain | Example metrics |
|--------|-----------------|
| Journey Outcomes | VAJSR, abandonment, reroutes |
| Data Quality | % graph verified, median evidence age, report-to-validation time |
| Consumer Experience | Participant confidence, unexpected barrier rate |
| Enterprise Adoption | API usage, partner count, webhook volume |
| Mission & Equity | Geographic coverage inequality |
| Privacy & Security | Privacy incidents, consent revocation rate |
| Research Translation | Research participation, pilot completions |
| Commercialisation | Commercial recurring revenue (aggregate) |

## Dashboard metrics (minimum)

- Verified Accessible Journey Success Rate
- Unexpected accessibility barrier rate
- Critical false-safe recommendation rate
- Percentage of graph with verified evidence
- Median evidence age
- Time from report to validation
- Geographic coverage inequality index
- Participant confidence (median)
- Enterprise API usage
- Barriers referred to infrastructure owners
- Barriers resolved
- Research participation rate
- Privacy incidents
- Commercial recurring revenue

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `lib/impact/metric-registry.ts` |
| Create | `lib/impact/collectors/journey-outcomes.ts` |
| Create | `lib/impact/collectors/data-quality.ts` |
| Create | `lib/impact/collectors/enterprise-adoption.ts` |
| Create | `lib/impact/dashboard/impact-dashboard-service.ts` |
| Create | `lib/impact/dashboard/accessible-charts.ts` — tables, text summaries, SR descriptions |
| Create | `app/admin/innovation-impact/page.tsx` |
| Extend | PostHog integration — product analytics only, lane-gated |
| Create | `lib/impact/storage/neon-analytics.ts` — sensitive metrics |
| Create | `tests/impact/metric-registry.test.ts` |
| Create | `tests/impact/research-marketing-isolation.test.ts` |
| Create | `tests/impact/accessible-dashboard.test.ts` |

## Analytics routing

| Data sensitivity | Destination |
|------------------|-------------|
| Product funnels, feature usage | PostHog (with consent) |
| VAJSR, research outcomes, PII-adjacent | Neon/internal analytics |
| Commercial revenue | Billing tables + aggregate dashboard |

## Accessible chart equivalents

- Data tables with sortable columns
- Text summaries for each chart ("VAJSR was 78% this month, up 3 points")
- `aria-describedby` linking charts to summaries
- Keyboard-navigable dashboard controls
- No colour-only encoding

## Tests required

- Research participant ID cannot join marketing cohort in PostHog
- Sensitive metrics never appear in PostHog capture calls
- Dashboard renders table fallback when charts disabled
- VAJSR calculation matches research journey fixtures

## Docs to write

- `docs/impact/innovation-metrics.md`
- Update `docs/innovation/PORTFOLIO_KPIS.md`

## Commit message (exact)

```
feat: add MapAble innovation impact measurement
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/impact`
- [ ] axe scan on dashboard page
- [ ] Privacy review of metric routing

## Rollback notes

Disable innovation impact dashboard flag; metrics collectors no-op.

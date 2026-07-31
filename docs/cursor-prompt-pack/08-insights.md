# MapAble Research / Insights — Cursor prompt pack

## 1. Product purpose

Anonymised dashboards: accessibility gaps, service shortages, transport barriers, provider coverage, outcome trends.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| MapAble admin | All dashboards, exports |
| Provider admin | Org-aggregated slice only |
| Research partner | Signed DUA exports (later) |
| Public | None in MVP |

## 3. MVP features

- `InsightDashboard` config (widgets JSON)
- Nightly job stub populating `AggregatedMetric` (region, metric key, value)
- Service gap report generator (transport + care wait times)
- Accessibility gap report from mapping/lens inputs
- `ExportRequest` queue (admin approves)
- Admin UI charts (recharts or similar)

## 4. Later features

- Differential privacy layer
- Public open data subset
- Federated research (existing admin routes)

## 5. Database tables

`InsightDashboard`, `AggregatedMetric`, `ServiceGapReport`, `AccessibilityGapReport`, `RegionProfile`, `ExportRequest`

## 6. API routes

```
GET /api/admin/insights/dashboards
GET /api/admin/insights/metrics
POST /api/admin/insights/reports/generate
POST /api/admin/insights/exports
GET /api/admin/insights/exports/[id]
```

## 7. Frontend

- `app/admin/insights/page.tsx`, `reports/[reportId]`
- `components/insights/MetricChart`, `GapMapPlaceholder`, `ExportQueue`

## 8. Integrations

Provider Finder, Accessibility Mapping, Transport, Care, Admin Dashboard.

## 9. Accessibility

- Chart data table alternative
- Text summary for each widget

## 10. Privacy rule

**Only aggregated, de-identified data** unless explicit consent record `ResearchConsent`. Minimum cell size k≥5. No participant names in exports.

## 11. Audit

`insights.report.generated`, `insights.export.requested`, `insights.export.approved`

## 12. Tests

- Raw participant row rejected from export pipeline
- k-anonymity check on region metrics

## 13. Seed

3 metrics × 5 regions, 1 sample gap report.

**Branch:** `cursor/insights-mvp-ce11`

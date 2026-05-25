# MapAble Core — Phase 8

Phase 8 adds **repeatable national infrastructure**: app store release process, transport network rollout, compliance renewals, settlement batches, national insights, public API v1/v2 versioning, SLA and grant reporting, external security audit packs, assessor tools, data trust council, and platform status.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `app-store-release` | Store submission checklist |
| `transport-network-rollout` | Regional rollout tracking |
| `compliance-renewals` | Control renewal calendar |
| `settlement-batches` | Invoice settlement batches |
| `national-insights` | Suppressed aggregate snapshots |
| `api-versioning` | v1 stable, v2 draft policy |
| `sla-reporting` | Placeholder SLA reports |
| `grant-reporting` | Grant outcome reports |
| `external-security-audit` | Audit evidence packs |
| `assessor-tools` | Assessor case workflow |
| `platform-status` | `/status` health checks |
| `data-trust-council` | Council meeting records |
| `partner-marketplace` | Listings (flag-gated off) |

## Public routes

- `/status` — platform health (runs checks on each visit)
- `/insights/national` — published national snapshots
- `/assessor` — assessor portal (`assessor:portal` permission)

## API versions

- `/api/v1/places` — stable default
- `/api/v2/places` — draft expanded response shape

## Admin routes

`/admin/app-store-release`, `/admin/transport-network`, `/admin/compliance-renewals`, `/admin/settlement-batches`, `/admin/national-insights`, `/admin/api-versioning`, `/admin/sla-reporting`, `/admin/grant-reporting`, `/admin/security-audit-packs`, `/admin/data-trust-council`, `/admin/partner-marketplace`

Matching `GET`/`POST` under `/api/admin/*` plus `/api/admin/platform-status` and `/api/assessor/cases`.

## Feature flags

| Flag | Default |
|------|---------|
| `APP_STORE_RELEASE_PROCESS_ENABLED` | true |
| `NATIONAL_INSIGHTS_ENABLED` | true |
| `PARTNER_MARKETPLACE_ENABLED` | false |
| `PUBLIC_API_VERSIONING_ENABLED` | true |
| `SLA_REPORTING_ENABLED` | true |
| `EXTERNAL_SECURITY_AUDIT_READINESS_ENABLED` | true |
| `DATA_TRUST_COUNCIL_ENABLED` | true |

## Limitations

- SLA metrics are placeholders until observability is wired
- Settlement batches use simplified invoice matching
- v2 API remains draft; v1 is default for partners
- Partner marketplace disabled unless explicitly enabled

## Phase 9 next

Mature civic platform: data vault, public decision register, i18n, longitudinal impact.

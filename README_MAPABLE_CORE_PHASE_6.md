# MapAble Core — Phase 6

Phase 6 adds **production and ecosystem launch** tooling: launch readiness, dispatch console, provider quality, AI governance, partner sandbox, accessibility accreditation, open data (gated), government report drafts, disaster recovery exercises, evidence automation, board reporting, and community governance.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules (`lib/`)

| Module | Service |
|--------|---------|
| `launch-readiness` | Production checklist |
| `dispatch-console` | Care/transport/incident queues |
| `provider-quality` | Explainable quality scores |
| `ai-governance` | Model monitors & incidents |
| `partner-sandbox` | Test apps (no prod participant data) |
| `accessibility-accreditation` | Scored cases with disclaimers |
| `open-data` | Privacy-safe exports (flag-gated) |
| `government-reporting` | Draft packs only |
| `disaster-recovery` | Exercise evidence |
| `evidence-automation` | SOC/ISO snapshot jobs |
| `board-reporting` | Aggregate board metrics |
| `community-governance` | Meetings & decisions |
| `mobile-production` | Release checklists |

## Admin routes

`/admin/launch-readiness`, `/admin/dispatch`, `/admin/provider-quality`, `/admin/ai-governance`, `/admin/partner-sandbox`, `/admin/accessibility-accreditation`, `/admin/open-data`, `/admin/disaster-recovery`, `/admin/evidence-automation`, `/admin/board-reporting`, `/admin/community-governance`

## APIs

`GET/POST /api/admin/launch-readiness`, `/api/admin/dispatch`, `/api/admin/provider-quality`, `/api/admin/ai-governance`, `/api/admin/partner-sandbox`, `/api/admin/board-reporting`, `/api/admin/community-governance`, `/api/admin/open-data`, `/api/admin/government-reporting`, `/api/admin/evidence-automation`

## Limitations

- No autonomous dispatch or assignment
- No legal certification claims for accreditation
- Open data and government reporting default **disabled**
- No SOC 2 / ISO certification from evidence jobs

## Phase 7 next

Mobile release hardening, operator dispatch, payment reconciliation, multi-tenant admin, enterprise/government portals.

# MapAble Core — Phase 5

Phase 5 adds **regulated pilot maturity and production-readiness** on top of Phases 1–4. It scaffolds AI-assisted matching with fairness checks, advanced provider verification, NDIS pricing catalogue management, mature Xero/Stripe integration boundaries, mobile API contracts, route optimisation, accessibility map data, support coordinator and plan manager portals, employer ATS-lite, reporting, developer API platform, compliance evidence, security readiness (SOC 2 / ISO 27001 scaffolding), and NDIA API readiness — **without** unsafe automation or false compliance claims.

## Architecture (`lib/`)

| Module | Path | Purpose |
|--------|------|---------|
| AI matching | `lib/ai-matching` | Reviewable AI ranking atop Phase 4 rules |
| Fairness | `lib/fairness` | Bias and suitability flags |
| Provider verification | `lib/provider-verification` | Cases, checks, risk ratings |
| ABN Lookup (ABR) | `lib/abn-lookup` | ABR web services adapter, validation, name match |
| Worker verification | `lib/worker-verification` | Credential orchestration + optional contractor ABN |
| NDIS pricing | `lib/ndis-pricing` | Catalogue import, validate, apply |
| Xero | `lib/xero` | Safe invoice sync (no sensitive notes) |
| Stripe billing | `lib/stripe-billing` | Private-pay, webhooks, refunds |
| Mobile shell | `mobile-contracts/` | Future native app contracts |
| Route optimisation | `lib/route-optimisation` | Placeholder travel plans |
| Accessibility map | `lib/accessibility-map` | Places, features, links |
| Support coordinator | `lib/support-coordinator` | Consent-gated portal |
| Plan manager | `lib/plan-manager` | Invoice review (no NDIA submit) |
| Employer ATS | `lib/employer-ats` | Pipeline, interviews, adjustments |
| Reporting | `lib/reporting` | Snapshots, small-cell suppression |
| Developer API | `lib/developer-api` | Apps, hashed keys, scopes |
| Compliance evidence | `lib/compliance-evidence` | Controls, retention dry-run |
| Security readiness | `lib/security-readiness` | SOC2/ISO scaffolding |
| NDIA readiness | `lib/ndia-readiness` | Evidence bundles, dry-run only |

## What Phase 5 does **not** add

- Autonomous AI assignment
- Real NDIA / PACE claim submission
- NDIS Commission auto-reporting
- SOC 2 or ISO 27001 certification
- Production native mobile app
- Full fleet route optimisation
- Unrestricted public API to participant sensitive data

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Configuration

See `.env.example` — integrations default **off** (`AI_MATCHING_ENABLED=false`, `XERO_ENABLED=false`, `NDIA_REAL_SUBMISSION_ENABLED=false`).

ABN verification uses `ABR_LOOKUP_ADAPTER_MODE=mock` until you register a GUID; see [docs/abn-verification.md](docs/abn-verification.md).

## Phase 6 recommendations

Native mobile production build, real-time dispatch, provider quality dashboard, approved NDIA API pilot (if formally authorised), data warehouse automation, partner sandbox, multi-region DR.

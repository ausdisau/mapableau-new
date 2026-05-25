# MapAble Core — Phase 7

Phase 7 adds **live pilot and scale operations**: mobile release hardening, operator dispatch, payment reconciliation, plan manager pilot, NDIA pilot (flag-gated), public transparency, multi-tenant admin, enterprise and government portals, public beta, social impact, and scale planning.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `multi-tenant-admin` | Tenant boundaries |
| `payment-reconciliation` | Stripe + Xero + MapAble matching |
| `operator-dispatch` | Reassign, cancel resolutions |
| `provider-onboarding-automation` | Onboarding task workflows |
| `plan-manager-pilot` | Partner exports |
| `ndia-pilot` | Approval-gated dry runs only |
| `accreditation-public-program` | Published profiles |
| `public-transparency` | Approved publications |
| `enterprise-provider` | Org-scoped console |
| `government-portal` | Aggregate council data |
| `public-beta` | Cohort feedback |
| `social-impact` | Outcomes with suppression |
| `scale-plan` | Board-approved milestones |
| `mobile-release` | Release blockers |
| `ai-monitoring-dashboard` | Fairness trend snapshots |
| `dr-exercises` | Automated DR steps |

## Public routes

- `/enterprise-provider` — provider admin console (permission `enterprise:console`)
- `/government-partner` — disabled unless `GOVERNMENT_PARTNER_PORTAL_ENABLED=true`
- `/transparency` — approved publications
- `/accreditation` — published accreditation profiles

## Admin routes

- `/admin/payment-reconciliation`
- `/admin/operator-dispatch`
- `/admin/mobile-release`
- `/admin/provider-onboarding`
- `/admin/plan-manager-pilot`
- `/admin/tenants`
- `/admin/public-beta`
- `/admin/social-impact`
- `/admin/scale-plan`
- `/admin/ndia-pilot`
- `/admin/accreditation-public`
- `/admin/ai-monitoring`
- `/admin/public-transparency`
- `/admin/government-portals`
- `/admin/dr-exercises`

## Admin APIs

`GET`/`POST` under `/api/admin/` for: `payment-reconciliation`, `operator-dispatch`, `mobile-release`, `provider-onboarding`, `plan-manager-pilot`, `tenants`, `ndia-pilot`, `accreditation-public`, `ai-monitoring`, `public-transparency`, `government-portals`, `dr-exercises`, `public-beta`, `social-impact`, `scale-plan`.

## Feature flags (`.env.example` Phase 7)

| Flag | Default |
|------|---------|
| `MULTI_TENANT_PARTNER_ADMIN_ENABLED` | true |
| `PUBLIC_BETA_ENABLED` | false |
| `ENTERPRISE_PROVIDER_CONSOLE_ENABLED` | true |
| `GOVERNMENT_PARTNER_PORTAL_ENABLED` | false |
| `SOCIAL_IMPACT_MEASUREMENT_ENABLED` | true |
| `NDIA_PILOT_ENABLED` | false |

## Limitations

- NDIA pilot does not submit claims without `NDIA_PILOT_ENABLED` and governance approval
- Government portal disabled unless `GOVERNMENT_PARTNER_PORTAL_ENABLED=true`
- Reconciliation uses placeholder matching logic
- DR automation records steps only — human sign-off required

## Phase 8 next

App store release process, transport network rollout, national insights, API versioning.

# MapAble Core — Phase 9

Phase 9 adds a **mature civic platform**: national rollout stages, partner billing, partner API program, assessor network, public decision register, personal data vault, research safe room, provider benchmarking, governance charter, internationalisation, and longitudinal impact waves.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `national-rollout` | National region rollout stages |
| `partner-billing` | Partner organisation billing accounts |
| `partner-api-program` | API partner enrollments (flag-gated) |
| `assessor-network` | Registered assessor directory |
| `public-decision-register` | Published governance decisions |
| `personal-data-vault` | User export/portability requests |
| `research-safe-room` | Ethics-gated synthetic research projects |
| `provider-benchmarking` | Suppressed aggregate benchmarks |
| `governance-charter` | Ratified charter versions |
| `internationalisation` | Locale translation strings |
| `longitudinal-impact` | Impact study waves |

## Public routes

- `/data-vault` — participant data requests (`data_vault:self`)
- `/decisions` — public decision register
- `/governance` — active ratified charter
- `GET /api/i18n/[locale]` — translation bundle
- `GET/POST /api/data-vault` — vault API for authenticated users

## Admin routes

`/admin/national-rollout`, `/admin/partner-billing`, `/admin/partner-api-program`, `/admin/assessor-network`, `/admin/public-decisions`, `/admin/personal-data-vault`, `/admin/research-safe-room`, `/admin/provider-benchmarking`, `/admin/governance-charter`, `/admin/i18n`, `/admin/longitudinal-impact`

Matching `/api/admin/*` endpoints for each module.

## Feature flags

| Flag | Default |
|------|---------|
| `PERSONAL_DATA_VAULT_ENABLED` | true |
| `PUBLIC_DECISION_REGISTER_ENABLED` | true |
| `INTERNATIONALISATION_ENABLED` | true |
| `LONGITUDINAL_IMPACT_ENABLED` | true |
| `PUBLIC_API_PARTNER_PROGRAM_ENABLED` | false |
| `RESEARCH_SAFE_ROOM_ENABLED` | false |

## Limitations

- Data vault requests require human review before export/deletion
- Research safe room disabled unless explicitly enabled
- Benchmarks suppressed for small cohorts — not competitive rankings
- Partner API program enrollment blocked when flag is off

## Phase 10 next

API certification, algorithm register, oversight board, privacy-preserving analytics, outcomes portal.

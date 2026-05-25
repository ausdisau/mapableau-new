# MapAble Core — Phase 10

Phase 10 completes the **public-interest operating system**: API certification, public algorithm register, oversight board portal, privacy-preserving analytics, federated research, provider academy, data trust annual reports, sustainability planning, and long-term outcomes.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `api-certification` | Partner API certification workflow |
| `algorithm-register` | Published algorithm transparency |
| `oversight-board` | Board meetings and decisions |
| `privacy-preserving-analytics` | DP-placeholder analytics runs |
| `federated-research` | Cross-institution agreements (flag-gated) |
| `provider-academy` | Training courses and enrollments |
| `data-trust-annual-report` | Annual accountability reports |
| `sustainability-plan` | Environmental/governance milestones |
| `long-term-outcomes` | Published outcome snapshots |

## Public routes

- `/algorithms` — public algorithm register
- `/oversight` — oversight board portal
- `/outcomes` — long-term outcomes
- `/academy` — provider training (`provider_academy:enroll`)

## Admin routes

`/admin/api-certification`, `/admin/algorithm-register`, `/admin/oversight-board`, `/admin/privacy-analytics`, `/admin/federated-research`, `/admin/provider-academy`, `/admin/data-trust-reports`, `/admin/sustainability-plan`, `/admin/long-term-outcomes`

Matching `/api/admin/*` plus `POST /api/academy/enroll`.

## Feature flags

| Flag | Default |
|------|---------|
| `PUBLIC_ALGORITHM_REGISTER_ENABLED` | true |
| `OVERSIGHT_BOARD_PORTAL_ENABLED` | true |
| `PRIVACY_PRESERVING_ANALYTICS_ENABLED` | true |
| `SUSTAINABILITY_PLAN_ENABLED` | true |
| `API_CERTIFICATION_PROGRAM_ENABLED` | false |
| `FEDERATED_RESEARCH_ENABLED` | false |

## Limitations

- Privacy analytics uses placeholder differential privacy — not production-grade DP
- API certification and federated research disabled unless explicitly enabled
- Algorithm register is transparency only — not regulatory certification
- Outcomes suppressed for small cohorts per Phase 5 thresholds

## Phases 6–10 complete

See `README_MAPABLE_PHASES_6_TO_10.md` for the full roadmap. Phase 11 (accountability portal, constitutional safeguards) is documented as preview only — not implemented here.

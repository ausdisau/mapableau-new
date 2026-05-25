# MapAble Phase 13 — Service Resilience & Growth

Phase 13 adds operational resilience modules behind database-backed feature flags.

## Deploy

```bash
pnpm install
pnpm exec prisma db push
pnpm exec prisma generate
pnpm prisma db seed
```

## Feature flags (admin)

- UI: `/admin/feature-flags`
- API: `/api/admin/feature-flags`, `/api/feature-flags/evaluate`
- Seed keys: `service_recovery_enabled`, `waitlist_exchange_enabled`, `outcomes_tracker_enabled`, `quote_marketplace_enabled`, `support_desk_enabled`, `journey_timeline_enabled`, `evidence_pack_builder_enabled`, `unmet_need_register_enabled`, `provider_quality_signals_enabled`

## Modules

| Module | Participant routes | API prefix |
|--------|-------------------|------------|
| Service recovery | `/service-recovery` | `/api/service-recovery` |
| Waitlist & capacity | `/waitlists`, `/provider/capacity` | `/api/waitlists`, `/api/provider/capacity`, `/api/capacity` |
| Support desk | `/support`, `/admin/support-desk` | `/api/support/tickets` (extended) |
| Journey timeline | `/participant/timeline` | `/api/participant/timeline` |
| Outcomes tracker | `/participant/outcomes` | `/api/outcomes` |
| Quote marketplace | `/quotes` | `/api/quotes` |
| Evidence packs | `/evidence-packs` | `/api/evidence-packs` |
| Unmet need register | `/unmet-needs`, `/admin/unmet-needs` | `/api/unmet-needs`, `/api/admin/service-gaps` |
| Provider quality signals | `/provider/quality` | `/api/provider-quality/[providerId]` |

## Orchestration

- `lib/orchestration/service-recovery-orchestrator.ts` — opens cases on provider decline
- `lib/orchestration/capacity-orchestrator.ts`
- `lib/orchestration/outcomes-orchestrator.ts`
- `lib/orchestration/evidence-pack-orchestrator.ts`
- `lib/orchestration/support-desk-orchestrator.ts`
- `lib/orchestration/provider-quality-orchestrator.ts`

## Limitations

- PDF evidence export returns a placeholder reference
- Backup worker matching uses simplified organisation suggestions until full matching gates are wired
- Complaint escalation uses ticket flags; dedicated complaints workflow may extend later

## Manual QA

1. Toggle `service_recovery_enabled` and decline a booking as provider — recovery case appears
2. Create waitlist + provider capacity — run match API
3. Add outcome goal + check-in — timeline shows `goal_created`
4. Create quote, send to providers, submit response, compare, convert to booking
5. Open support ticket — admin queue shows ticket; reply via messages API
6. Export timeline and evidence pack — audit events created
7. Failed provider search with `recordUnmet=true` — unmet need recorded
8. Public provider search shows quality signal labels when enabled

## Demo seed

`prisma/seed-mapable-resilience.ts` seeds feature flags and beta group. Extend with fictional Alex Rivers / Priya Morgan scenarios in your environment after base seed users exist.

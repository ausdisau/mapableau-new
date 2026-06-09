# Y1 wedge pilot runbook

Activates the masterplan Year 1 trust infrastructure for one organisation and participant cohort.

## Prerequisites

- Staging database with demo participants (`participant@mapable.test`)
- Run `pnpm prisma db seed` after enabling wedge flags

## Environment bundle

```env
Y1_WEDGE_PILOT_ENABLED=true
Y1_WEDGE_PILOT_ORG_ID=<organisation-uuid>
Y1_WEDGE_PILOT_COHORT_EMAILS=participant@mapable.test,participant2@mapable.test
Y1_WEDGE_PILOT_INCLUDE_Y2=true

SUPPORT_PROFILE_ENABLED=true
PARTICIPANT_MATCH_REVIEW_ENABLED=true
BACKUP_SHIFT_RECOVERY_ENABLED=true
INCIDENT_INTAKE_V2_ENABLED=true
MICRO_CONSENT_ENABLED=true

# Optional Y2 orchestration in same pilot
BACKUP_RECOVERY_PILOT_ENABLED=true
CARE_TRANSPORT_ORCHESTRATION_V2_ENABLED=true
```

## Participant UX path

1. **Support profile** → `/dashboard/support-profile` — publish routines and boundaries
2. **Match review** → `/dashboard/care/matches/[careRequestId]` — explainable matching
3. **Backup recovery** → `/dashboard/care/recovery/[shiftId]` — continuity when shifts fail
4. **Pilot hub** → `/dashboard/pilot` — navigation and metrics summary

## Success metrics (masterplan proxies)

| Metric | Target | API |
|--------|--------|-----|
| Continuity-adjusted supported weeks | ↑ | `GET /api/admin/pilot/y1-wedge/metrics` |
| Match dispute rate | ↓ | same |
| Backup recovery success rate | ↑ | same |

Kill criteria: ≥2 serious backup misfits in 30 days (`killCriteriaBreached` in metrics).

## Admin

- Backup recovery queue: `/admin/backup-recovery`
- Agent run review: `/admin/agent-runs`
- Y1 metrics: `/api/admin/pilot/y1-wedge/metrics`

## Seed

Import wedge demo data:

```bash
Y1_WEDGE_PILOT_ENABLED=true pnpm prisma db seed
```

The seed calls `seedMapableY1Wedge()` when pilot flags are enabled.

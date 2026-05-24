# Working With Children (WWC) verification

State and territory child-related checks for workers, drivers, and volunteers on MapAble.

## Architecture

- Types: [`types/wwc-verification.ts`](../types/wwc-verification.ts)
- Adapters: [`lib/verification/wwc/`](../lib/verification/wwc/) — manual adapter (MVP) plus jurisdiction placeholders (no portal scraping)
- Eligibility: [`lib/verification/wwc/wwc-eligibility-service.ts`](../lib/verification/wwc/wwc-eligibility-service.ts)
- Matching integration: [`lib/matching/matching-service.ts`](../lib/matching/matching-service.ts)

## Worker UI

- `/worker/verification/wwc` — submit check and view status

## Admin UI

- `/admin/verification/wwc` — review queue
- `/admin/verification/wwc/[id]` — decision panel and timeline

## Cron

`GET /api/cron/wwc-expiry-check` with `Authorization: Bearer $CRON_SECRET` — marks expired checks and sends reminders at 90, 60, 30, 14, and 7 days.

## Privacy

- Participants see [`WwcPublicBadge`](../components/verification/wwc/WwcPublicBadge.tsx) only — no evidence or criminal history.
- Evidence documents use `admin_only` visibility and category `worker_screening`.

WWC verification does **not** replace NDIS Worker Screening.

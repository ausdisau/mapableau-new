# Audio/video conferencing (Communication Centre)

Thread-scoped audio and video calls use a **provider adapter** in `lib/conference/`. The default for local development is **mock** (no external service). Production can use **Daily.co**.

## Environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `CONFERENCE_PROVIDER` | No | `mock` (default) or `daily` |
| `DAILY_API_KEY` | For Daily | Server-side REST API key |
| `DAILY_DOMAIN` | For Daily | Daily subdomain (e.g. `mapable` → `mapable.daily.co`) |
| `NEXT_PUBLIC_DAILY_DOMAIN` | For Daily | Same subdomain for client join URLs |

Set these on **Vercel** (Production and Preview) alongside existing `DATABASE_URL` / messaging vars. No extra Neon schema beyond the `conference_aac` migration.

## Database

Apply migration:

```bash
pnpm exec prisma migrate deploy
# or on drifted Neon:
pnpm exec prisma db execute --file prisma/migrations/20260525120000_conference_aac/migration.sql
```

Models: `ConferenceSession`, `ConferenceParticipant`, `AacPhrase`.

## API routes

- `GET/POST /api/messages/threads/[threadId]/conference` — active session / start call
- `POST /api/messages/threads/[threadId]/conference/end` — end call
- `GET/PATCH /api/aac/phrases` — list/save quick phrases
- `POST /api/messages/threads/[threadId]/aac-speak` — send phrase as message

## UI

- **Messages overlay** and **Communication Centre**: thread tabs **Chat | Call | Details | Actions**
- **Call** nested tabs: **Audio | Video**
- **AAC**: quick-phrase bar in Chat and Call; editor at `/dashboard/accessibility/edit`
- Default **Show AAC** when `aac` is in accessibility `communicationPreferences`

## Security

- Same thread access policy as messages (`canViewThread` / `canSendInThread`)
- Meeting tokens are minted server-side only
- Sensitive thread types get audit events on conference start

## Swapping providers

Replace `lib/conference/daily-conference-adapter.ts` or add a new adapter and branch in `getConferenceAdapter()`. Postgres models and UI stay the same.

## Tests

```bash
pnpm test tests/conference-aac.test.ts
```

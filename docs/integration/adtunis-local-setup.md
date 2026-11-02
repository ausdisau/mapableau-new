# Adtunis local setup (MapAble)

## Prerequisites

- Node.js / pnpm as used by MapAble root
- Database available for Prisma (workspace table + consent scopes)

## Enable the Care slice (local)

```bash
# .env (examples — never commit secrets)
MAPABLE_ADTUNIS_ENABLED=true
ADTUNIS_MESSAGING_MODE=mock
ADTUNIS_SIMULATED_ASR=true
MAPABLE_AAC_COMMUNICATION_ENABLED=true
```

Optional live private ASR (not required for Care text/AAC path):

```bash
ADTUNIS_ASR_APPROVED=true
ADTUNIS_ASR_ENDPOINT=http://127.0.0.1:8090/recognize
# ADTUNIS_ASR_TOKEN=...  # server-only
```

## Commands

```bash
pnpm db:generate
pnpm test -- tests/adtunis
pnpm type-check
```

Open `/care/communicate` while signed in as a participant.

## Rollback

1. Set `MAPABLE_ADTUNIS_ENABLED=false`.
2. Do not apply further Adtunis migrations in production without approval.
3. Mock deliveries never create real messages when mode is `mock`.

## Port to canonical MapAble

Copy `packages/adtunis-*`, `lib/adtunis`, `app/api/v1/adtunis`, `app/care/communicate`, related tests and docs into `ausdisau/MapAble` `apps/web`.

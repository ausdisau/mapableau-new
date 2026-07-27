# AURA Pocket (Wave 6)

Offline/sync surface for mission snapshots. Flag-gated; full Agent OS Pocket runtime remains limited.

## Flags

| Flag | Role |
|---|---|
| `MAPABLE_AURA_ENABLED` | Master gate (`MAPABLE_AURA_DISABLED` on APIs when false) |
| `MAPABLE_AURA_POCKET_ENABLED` | Pocket snapshot build |
| `MAPABLE_AURA_OFFLINE_RUNTIME_ENABLED` | Offline mission / sync capabilities |

## Security / resilience

- Snapshots stored under **hashed** user id (`userIdHash`)
- `listSnapshots` / create / delete / sync / stop derive identity from **session**, not query/body `userId`
- `DELETE /api/intelligence/aura/pocket/snapshots` applies `MAPABLE_AURA_DISABLED`
- `saveSnapshot` **preserves** original `createdAt` on updates
- Sync queue prioritises `stop_receipt`, then `deletion` — deletions are **not** blocked by offline execution-approval rejection
- `AuraOfflineStopControl` only calls `onStopped` after a **2xx** fetch response

## Routes

| Route | Notes |
|---|---|
| `GET/POST/DELETE /api/intelligence/aura/pocket/snapshots` | Session-bound |
| `POST /api/intelligence/aura/pocket/sync` | Session-bound |
| `POST /api/intelligence/aura/pocket/stop` | Offline stop queue |
| `POST /api/intelligence/aura/missions/[missionId]/stop` | Online stop |

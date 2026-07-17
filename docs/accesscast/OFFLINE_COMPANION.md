# AccessCast Offline Companion / Visit Pack

## Purpose

Persist a **bounded offline AccessCast** in MapAble Companion so participants can review a saved journey outlook without a network — without ever presenting an expired pack as current.

## Contracts

| Item | Location |
| --- | --- |
| Compile / evaluate / storage | `lib/accesscast/offline.ts` |
| Zod mobile schema | `mobile-contracts/schemas/accesscast-offline.ts` |
| Storage key | `companion.accesscast.outlook.v1` |
| Demo API | `POST /api/accesscast/offline/demo` |

## Required UI fields (always)

When showing an offline AccessCast:

1. **Generated time**
2. **Expiry**
3. **Sources not refreshed** / limitations
4. **Status label** (`Expired offline AccessCast — not current` when expired)
5. **Changed since saved** indicator when a newer hash is available

Do **not** silently present an offline forecast as live/current.

## Secure storage

- Production Companion must use `expo-secure-store` (or SQLCipher) via the encrypted store boundary.
- Never plain AsyncStorage for AccessCast packs.
- Packs are `redacted: true` — no diagnosis, no home address.

## Integration with Companion (#315)

When Native Companion lands:

1. After Visit Pack compile, optionally attach `compileAccessCastOfflinePack()`.
2. Save via `saveAccessCastOfflineLocal` / SecureStore key above.
3. On open: `evaluateAccessCastOfflinePack` before render.
4. Surface Stop AURA and human help alongside the card.

## Flags

Uses master AccessCast flags. Companion Visit Pack flag remains owned by Companion.

## Non-goals

- No background location
- No push notifications in this wave
- No automatic route changes

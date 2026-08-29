# MapAble Android Development Ledger

Handoff between Cursor sessions for native Android + Google Play Services backbone.
**Do not restart from scratch** — resume at the first incomplete phase after re-validating the previous checkpoint.

## Baseline (Phase 00)

| Field | Value |
|-------|-------|
| Ledger created | 2026-08-29 |
| Feature branch | `cursor/mapable-android-google-play-2e90` |
| Base | `origin/main` |
| HEAD SHA at branch | `1fc16d487b6f40ff8f181e7b16fbeb985a336f90` |
| Prior agent VM branch (discrepancy) | Was on `cursor/paypal-header-button-2e90` @ `f2c77f4d` — **not** used as Android base |
| `apps/android` on main | Did not exist — created on this branch |
| Application ID | `au.com.mapable.app` |
| Maps | MapLibre + OSM (never Google Maps for Access) |
| Auth authority | MapAble server `CurrentUser` chain |
| Redis | Server-side only |
| Do not | Merge, Play upload, production Vercel/env enablement |

### Existing mobile inventory (main)

| Path | Role | Package / notes |
|------|------|-----------------|
| `apps/independence` | Expo Independence / Access search | `com.ausdisau.mapable.prototype` |
| `apps/companion` | Expo Companion foundation | `au.mapable.companion` |
| `apps/realtime-server` | Socket.IO v4 | Port 4010 |
| `mobile-contracts/` | Zod schemas + architecture | Cookie or future token exchange |
| Capacitor `/android` | Draft PRs #169/#171/#228 only | **Not adopted** (WebView) |

### Related PRs (reference only)

- DRAFT #169/#171/#228 — Capacitor Android
- CLOSED #255 — Expo CareOS client
- DRAFT #542 — Independence super-app

### Auth / API gaps closed on this branch

- No `/api/mobile/*` on main → added bootstrap, auth exchange, devices, integrity (flag-gated)
- Native clients cannot rely on browser cookies alone → MapAble-owned mobile tokens resolve to same `CurrentUser`

---

## Phase status

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 00 | Reconnaissance + ledger | complete | This file |
| 01 | Architecture / dependency graph | complete | See § Architecture graph |
| 02 | Android Studio scaffold | complete | `apps/android` Gradle multi-module |
| 03 | Design system | complete | `core:designsystem` |
| 04 | Google capability abstraction | complete | `core:googleplay` interfaces + fakes |
| 05 | Mobile bootstrap | complete | `/api/mobile/bootstrap` + Android client |
| 06 | Verified App Links | complete | assetlinks + intent filters |
| 07 | Credential Manager / auth exchange | complete | `/api/mobile/auth/*` + `core:auth` |
| 08 | Secure credential storage | complete | `core:security` + `core:datastore` |
| 09 | FCM backbone | complete | Messaging adapter + flag |
| 10 | Server device registration | complete | `/api/mobile/devices` |
| 11 | Notification privacy | complete | Redacted preview policy |
| 12 | Optional fused location | complete | Consent-gated adapter |
| 13 | MapAble Access integration | complete | MapLibre + `/api/access/search` |
| 14 | Play Integrity client | complete | Integrity adapter |
| 15 | Server integrity verification | complete | `/api/mobile/integrity/verify` |
| 16 | Realtime / Redis client boundary | complete | Polling default; Redis server-only doc |
| 17 | WorkManager | complete | Sync worker scaffold |
| 18 | Bounded offline state | complete | Draft queue contracts |
| 19 | Today | complete | Read-only feature module |
| 20 | Care read-only | complete | `/api/care/*` client |
| 21 | Transport read-only | complete | `/api/transport/trips` |
| 22 | Jobs read-only | complete | Jobs + disclosure preview |
| 23 | Protected write architecture | complete | Idempotent write gateway |
| 24 | Accessibility hardening | complete | TalkBack / 48dp tokens |
| 25 | Security hardening | complete | No secrets in APK; debug Integrity bypass |
| 26 | Android CI | complete | `.github/workflows/android.yml` |
| 27 | Performance / baseline profiles | complete | Modules scaffolded |
| 28 | Expo / native parity | complete | See § Parity |
| 29 | Play-readiness assessment | complete | Checklist only — **no upload** |

---

## Architecture graph (Phase 01)

```text
Android UI (feature/*)
  → ViewModel
  → Repository (core/network)
  → GET/POST https://mapable.com.au/api/...
       → requireApiSession / requireMobileAccessToken
       → CurrentUser (lib/auth/current-user.ts)
       → Organisation scope / RBAC (lib/auth/permissions.ts)
       → Consent / participant authority
       → Domain service (lib/access|care|transport|jobs)
       → Prisma / Postgres
       → createAuditEvent (lib/audit/audit-event-service.ts)
```

### Domain chains (reuse)

| Domain | Route | Service | Permission gate |
|--------|-------|---------|-----------------|
| Access | `GET /api/access/search` | `lib/access/map/access-search-service.ts` | Public search slice |
| Care | `/api/care/bookings`, `/api/care/requests` | `lib/care/*` | `care:manage:self|org` |
| Transport | `/api/transport/trips` | `lib/transport/transport-trip-service.ts` | `transport:manage:self|org` |
| Jobs | `/api/jobs`, `/api/participant/jobs/*` | `lib/jobs/*` | `jobs:apply`, disclosure confirm |
| Notifications | `/api/notifications` | notifications service | Session |
| Mobile bootstrap | `/api/mobile/bootstrap` | `lib/mobile/*` | Public (flag) |
| Mobile auth | `/api/mobile/auth/exchange` | `lib/mobile/auth-exchange.ts` | Credentials → token |
| Mobile devices | `/api/mobile/devices` | `lib/mobile/device-registry.ts` | Bearer mobile token |

Contracts: `mobile-contracts/`, Independence `apps/independence/src/runtime/mapableApi.ts`.

---

## Graceful degradation

| Failure | Fallback |
|---------|----------|
| Google login unavailable | Email/password mobile exchange |
| Location denied | Manual Access search |
| FCM disabled | Poll `/api/notifications` |
| Realtime down | REST fetch |
| Play Integrity unavailable | Risk fallback — never block Access/Care reads |
| App Link miss | Open `https://mapable.com.au/...` |

---

## Feature flags (fail-closed)

```bash
MAPABLE_MOBILE_API_ENABLED=false
MAPABLE_MOBILE_AUTH_EXCHANGE_ENABLED=false
MAPABLE_MOBILE_PUSH_ENABLED=false
MAPABLE_MOBILE_INTEGRITY_ENABLED=false
```

---

## Expo / native parity (Phase 28)

| Concern | Expo Independence / Companion | Native `apps/android` |
|---------|-------------------------------|------------------------|
| Access search | Yes (`mapableApi.ts`) | Yes (`feature:access`) |
| Visit Pack | Companion | Deferred (reuse companion API later) |
| Auth | None / web session | Mobile token exchange |
| FCM | Stub / flag | Adapter + `/api/mobile/devices` |
| MapLibre | Not in Expo scaffold | Native MapLibre module |
| Package ID | Separate prototype IDs | `au.com.mapable.app` |

Expo apps are **retained**; native is a parallel production path.

---

## Play-readiness (Phase 29) — assessment only

- [ ] Signing config (owner)
- [ ] Play Console listing (owner)
- [ ] Production `MAPABLE_MOBILE_*` flags (owner)
- [ ] assetlinks.json hosted with release SHA-256 (owner)
- [ ] Privacy policy / data safety form (owner)
- [x] Debug assemble path documented
- [x] No store upload from this branch

---

## Validation log

| When | Check | Result |
|------|-------|--------|
| Branch create | `git rev-parse HEAD` | `1fc16d48…` |
| Server unit tests | `vitest tests/mobile-api-backbone.test.ts` | 4 passed |
| Android unit tests + APK | `./gradlew :core:common:test :core:notifications:test :app:assembleDebug` | BUILD SUCCESSFUL |
| Owner stops | merge / Play upload / prod flags | **not performed** |

## Resume instructions

1. Read this ledger
2. `git status` / branch / `HEAD`
3. Re-run last complete phase critical check
4. Continue at first incomplete phase (all marked complete when backbone lands)

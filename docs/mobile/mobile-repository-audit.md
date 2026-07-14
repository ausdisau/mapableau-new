# MapAble mobile repository audit (Wave 0)

**Source branch:** `agent/careos-platform-completion` (`8f8369ce`)  
**Target branch:** `cursor/mapable-mobile-ios-android-0e23`  
**Audit date:** 2026-07-14  
**Verdict:** Proceed with Expo React Native. No production Flutter app. Capacitor Android branches are WebView wrappers and must not be used.

## Repository shape

| Area | State |
|------|--------|
| Package manager | pnpm workspace (`pnpm@10.12.1`) |
| Workspace members | `.`, `apps/realtime-server`, `packages/*` |
| Turbo | Not present |
| Web app | Next.js 15 monolith at repo root |
| Existing mobile | `mobile/` Phase 13 shell docs only; `mobile-contracts/` Zod scaffolds |
| Capacitor / Android | Historic WebView wrappers on `cursor/android-app-*` — **reject** |
| Flutter | None |
| Expo / React Native | None before this branch |

## Canonical CareOS

- Mission model resolved: single Prisma `CareOSMission` (`docs/careos-mission-schema-resolution.md`).
- Versioned missions API: `GET /api/v1/missions` (API-key + participant authority).
- Intelligence routes under `/api/intelligence/careos-*` remain web-session oriented.
- Competing fabric migration quarantined; do not reintroduce dual schemas.

## Identity and authority

- NextAuth + OAuth providers (Auth0, Google, Apple, Microsoft, Facebook) in `lib/auth/`.
- Identity/authority flags: `lib/config/identity-authority.ts`.
- Participant authority gate: `lib/platform/developer-auth/participant-gate.ts`.
- Org membership ≠ participant authority (enforced server-side).

## Reusable platform packages

| Package / path | Reuse for mobile |
|----------------|------------------|
| `packages/contracts` | Journey, authority, passport Zod types |
| `mobile-contracts/schemas` | Offline queue, voice, push, booking summaries |
| `packages/intelligence-kernel` | Server-only — do not bundle |
| Domain packages (`domain-*`) | Server-side — do not bundle |
| Design tokens in `app/index.css` / `docs/design-system.md` | Extract to `mapable-design-tokens` |

## Push / realtime / offline

- Web push stubs: `MAPABLE_MOBILE_PUSH_ENABLED`, Pusher Beams web SDK.
- Realtime: `apps/realtime-server`.
- PWA offline: shell assets only (`public/sw.js`); participant data excluded.
- Native push (APNs/FCM) and encrypted offline store are mobile deliverables.

## Env and CI

- Env strategy: `.env.example` + fail-closed feature flags in `lib/config/*`.
- Existing CI: CareOS validation, release, Semgrep, Replit sync.
- Mobile CI workflow required: frozen lockfile, type-check, lint, tests, Expo Doctor, preview builds.

## Sensitive data — must not broadly cache

Full clinical histories, full NDIS plans, unrestricted incidents, full payment details, unrelated participant records, provider exports, admin data, authentication tokens in AsyncStorage/SQLite/logs.

## Branch / schema conflicts

- Prefer `agent/careos-platform-completion` over `agent/careos-national-platform`.
- Mobile must consume versioned contracts only; no second mission store on device.

## Shared-file conflicts

Wave 1 exclusive ownership: root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, shared contracts, feature flags, mobile CI, env schemas.

## Release blockers (pre-pilot)

1. EAS project + signing credentials (human).
2. OAuth public clients + PKCE redirect URIs.
3. TestFlight / Play internal testing accounts.
4. Privacy / accessibility / security human reviews before public store.

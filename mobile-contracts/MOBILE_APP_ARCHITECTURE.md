# MapAble Mobile App Architecture (Scaffold)

Phase 5 does **not** ship a production native app. This folder defines contracts for a future React Native / Expo client.

## Principles

- Reuse existing REST APIs under `/api/*`
- Shared Zod schemas in `mobile-contracts/schemas`
- Auth via NextAuth session cookie or future token exchange
- Offline: draft incidents and timesheet notes only (see `MOBILE_OFFLINE_STRATEGY.md`)
- Accessibility: 44px touch targets, screen reader labels, reduced motion

## Layers

1. **API client** — typed wrappers per role
2. **Schemas** — request/response validation
3. **Screens** — see `MOBILE_SCREEN_MAP.md`
4. **Design tokens** — spacing, type scale in `design-tokens/tokens.json`

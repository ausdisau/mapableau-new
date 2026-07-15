# Accessibility reviews — repository map

## Verified repository and remote

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ausdisau/mapableau-new` |
| Package name | `MapableAU` |
| Product | MapAble (`mapable.com.au`) |
| Branch for this work | `cursor/accessibility-reviews-v1-88d8` |
| Working tree at discovery | Clean on `main` |
| Verdict | Not `WRONG_REPOSITORY` |

## Actual architecture

- **Package manager:** pnpm 10.12.1 (`pnpm-workspace.yaml`: `.` + `apps/realtime-server`)
- **Web app:** Next.js 15 App Router at repo root (`app/`, `components/`, `lib/`)
- **API:** App Router REST handlers under `app/api/`
- **Database / ORM:** Prisma 6 + PostgreSQL (Neon in production); schema `prisma/schema.prisma`
- **Auth:** NextAuth (`app/api/auth/[...nextauth]/`); optional Auth0 / Azure AD / Keycloak; RBAC in `lib/auth/permissions.ts`, `roles.ts`, `guards.ts`
- **AD.iD:** Not present as a named product; use existing identity bridges
- **Maps:** MapLibre (`components/map/MapLibreMap.tsx`) + Leaflet Access map (`components/access/AccessMap.tsx`)
- **Access domain:** `AccessPlace`, reviews, accreditation, venue claims, moderation
- **Notifications:** `lib/notifications/notification-service.ts` + `Notification` / `NotificationPreference`
- **Messaging:** `Conversation` / `Message` + realtime-server
- **Support / moderation:** `SupportTicket`; Access moderation queue and content reports
- **Audit:** `AuditEvent` via `lib/audit/audit-event-service.ts`
- **Event bus:** No dedicated bus; domain event tables + audit + notifications
- **Feature flags:** Env-var gates in `lib/config/*` (not LaunchDarkly)
- **Analytics:** PostHog / Vercel Speed Insights (do not emit PII or private access context)
- **Design system:** `docs/design-system.md`, `app/index.css`, `components/ui/*`
- **Tests / CI:** Vitest (`pnpm test`); `pnpm lint`, `pnpm type-check`, `pnpm build`; husky `prepush`

## Exact relevant file paths

| Concern | Path |
| --- | --- |
| Place detail UI | `components/access/AccessPlaceProfile.tsx` |
| Place page | `app/access/places/[placeId]/page.tsx` |
| Access map shell | `components/access/MapAbleAccessShell.tsx`, `AccessMap.tsx`, `AccessPlaceCard.tsx` |
| Review form | `components/access-reviews/AddAccessReviewForm.tsx` |
| Review services | `lib/access-reviews/*` |
| Moderation | `lib/access-moderation/*` |
| Accreditation | `lib/access-accreditation/*`, `components/access-accreditation/*` |
| Place service | `lib/access-map/access-place-service.ts` |
| Copy / labels | `lib/access-map/copy.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Audit | `lib/audit/audit-event-service.ts` |
| Notifications | `lib/notifications/notification-service.ts` |

## Existing systems reused

Identity and roles, `AccessPlace` IDs, Prisma client, Access review models, accreditation assessments, moderation queue, content reports, support tickets, audit events, notification preferences, Document / review photo uploads, design tokens and UI primitives, Access map + list alternative.

## Location and map data flow

1. Access map / list selects a place (`AccessPlace` + `AccessPlaceLocation`).
2. Navigation to `/access/places/[placeId]` loads profile, published reviews, accreditation.
3. Marker secondary state must stay lightweight (summary fields only — no full comment threads).

## Identity and role model

- Session user via NextAuth `User` + `MapAbleUserRole` / assignments.
- Venue representatives via approved `AccessVenueClaim` / `AccessVenueProfile`.
- Assessors via existing assessor roles and accreditation APIs.
- Moderators / admins via `isAdminRole` and admin Access routes.
- Anonymous visitors may read published information only.

## Existing moderation and support flow

1. Content safety scan on review text → optional `AccessModerationQueue`.
2. `AccessContentReport` / review reports → moderation decisions.
3. Serious safeguarding categories escalate into protected support / incident paths; public status stays neutral (“Under review”).
4. All material actions record `AuditEvent` and Access domain events.

## Proposed file-by-file implementation plan

See ADR-001 and DATA_MODEL. Summary:

- Config: `lib/config/accessibility-reviews.ts`
- Domain: extend `lib/access-reviews/*`; add `lib/access-gamification/*`
- Moderation: extend `lib/access-moderation/*`
- API: `app/api/access/places/[placeId]/accessibility-summary`, comments, reactions, alerts; account contribution routes
- UI: Accessibility section on place profile; multi-step review flow; contribution profile section
- Migration: additive Prisma migration only

## Migration strategy

Additive migration under `prisma/migrations/` with new enums/tables/columns. Never replace historical migrations. Backward compatible with existing `AccessPlaceReview` rows.

## Feature-flag strategy

- Env: `ACCESSIBILITY_REVIEWS_V1_ENABLED=true`
- Config: `lib/config/accessibility-reviews.ts` → `accessibilityReviewsV1Enabled`
- Flag-off: existing community review UI and services remain available

## Lint, typecheck, test, build

```bash
pnpm setup:cloud-agent
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

## Dirty-file conflicts

None at discovery (clean working tree).

## Assumptions and blockers

- Auth0 / Azure AD stands in for “AD.iD” wording in the mission brief.
- Feature rollout uses env gates, not a hosted flag service.
- Legacy `AccessibilityReview` / `AccessiblePlace` models are not the write path.
- Mapping challenges are Access-scoped tables (no prior campaign challenge product).

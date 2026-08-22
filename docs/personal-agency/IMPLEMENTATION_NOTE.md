# My MapAble / Personal Agency Infrastructure — implementation note

**Claim state:** IN_DEVELOPMENT. Flags default OFF. Not production-ready PAI.

## CURRENTLY PRESENT

- Authenticated participant hub at `/dashboard/*` (card grid control panel)
- `DashboardAppShell`, `DashboardNav`, `MapAbleAppShell` (marketing / app / minimal)
- Public accessibility map at `/access`, marketing homepage, `/go` (flag-gated)
- Auth: `requireAuth()`, `requireApiSession()`, permission matrix
- Consent: `ConsentRecord`, `/dashboard/consent`, `/participant/privacy`
- Delegates: `ParticipantAuthorityGrant`, `/participant/delegates` (flag-gated invites)
- Audit: `AuditEvent`, `createAuditEvent()`
- Accessibility: `AccessibilityProfile`, digital preferences JSON, UI preferences panel
- Adaptive presentation: `adaptParticipantDashboard()` (profile persistence incomplete)
- Guided search / Ask: `GuidedSearchDialogue`, `/ask`, provider finder chat
- Go slice: `/go`, navigate engine (separate flags)

## REUSABLE

- `MapAbleAppShell`, skip link, brand tokens
- `requireAuth` / API session guards
- `AccessibilityProfile.digitalPreferences` for setup prefs (no diagnosis fields)
- `createAuditEvent` for agency activity (no second audit system)
- `listPeopleWithAccess`, consent timeline from participant privacy pages
- `GuidedSearchDialogue` for assistant shell (read-only routing, no autonomous execution)
- Access provenance labels from `lib/access/infrastructure/provenance.ts`

## MISSING (deferred beyond this slice)

- Full PAI orchestration, autonomous agents, MCP actuation
- Financial execution, provider auto-contact, device telemetry/control
- Canonical redirect from `/dashboard` to `/my`
- Persisted information density adaptation UI (STANDARD/SIMPLER/DETAILED)
- PostGIS / national routing; Care/Transport/Jobs as live general services

## DELIVERED IN THIS PR

- Feature flags: `MAPABLE_PERSONAL_AGENCY_*` (fail-closed, default OFF)
- Additive `LifeIntent` Prisma model + migration
- `/my` authenticated shell (desktop + mobile nav)
- `/my` home redesign (intent-led, real bookings or empty states)
- `/my/life`, `/my/control`, `/my/control/activity`, `/my/people`, `/my/devices`, `/my/setup`, `/my/ask`
- Public `/personal-agency` explainer + homepage section
- Agency indicator, evidence drawer, agency confirmation primitives
- Assistant shell linking to guided search (no consequential execution)
- Tests: auth gates, life intent isolation, Playwright public surfaces

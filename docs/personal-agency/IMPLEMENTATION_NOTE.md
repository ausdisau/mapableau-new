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

## MISSING

- `/my/*` route namespace
- `LifeIntent` model and APIs
- Participant-first home (intent / today / what matters)
- Agency indicator, privacy & control as primary destination under `/my`
- First-run progressive setup flow
- Reusable `AgencyConfirmation`, `EvidenceDrawer` PAI components
- Unified My MapAble navigation shell

## THIS PR WILL ADD

- Feature flags: `MAPABLE_PERSONAL_AGENCY_*` (fail-closed)
- Additive `LifeIntent` Prisma model + migration
- `/my` authenticated shell (desktop + mobile nav)
- `/my` home redesign (intent-led, real data or empty states)
- `/my/life`, `/my/control`, `/my/control/activity`, `/my/people`, `/my/devices`, `/my/setup`
- Public `/personal-agency` explainer + homepage section
- Agency indicator, evidence drawer, agency confirmation primitives
- Assistant shell linking to guided search (no consequential execution)
- Tests: auth gates, life intent isolation, a11y shell

## DEFERRED

- Full PAI orchestration, autonomous agents, MCP actuation
- Financial execution, provider auto-contact, device telemetry/control
- Canonical redirect from `/dashboard` to `/my`
- PostGIS / national routing, Care/Transport/Jobs as live general services
- Persisted `ParticipantAccessProfile` for density adaptation

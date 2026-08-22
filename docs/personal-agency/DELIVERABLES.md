# My MapAble — Personal Agency Infrastructure (vertical slice)

## 1. Implementation summary

First safe vertical slice of **Personal Agency Infrastructure (PAI)** / **My MapAble**: participant-controlled authenticated workspace with intent-led home, Life Intents, privacy & control, agency activity, progressive first-run setup, and reusable agency UX primitives. Public MapAble remains ungated. `/dashboard/*` unchanged.

**Claim state:** IN_DEVELOPMENT — flags default OFF; public copy uses “being developed” language.

## 2. Files added

| Area | Paths |
|------|-------|
| Docs | `docs/personal-agency/IMPLEMENTATION_NOTE.md`, `docs/personal-agency/DELIVERABLES.md` |
| Config | `lib/config/personal-agency.ts` |
| Services | `lib/personal-agency/*` (gates, life-intent, agency-activity, setup, agency-copy) |
| Components | `components/personal-agency/*` |
| Routes | `app/my/**`, `app/(marketing)/personal-agency/page.tsx` |
| APIs | `app/api/my/**` |
| Marketing | `components/marketing/home/MyMapAbleHomepageSection.tsx` |
| Migration | `prisma/migrations/20260822120000_personal_agency_life_intent/` |
| Tests | `tests/personal-agency/*`, `tests/a11y/my-mapable.spec.ts` |

## 3. Files modified

- `prisma/schema.prisma` — `LifeIntent` model + `LifeIntentStatus` enum
- `.env.example` — PAI feature flags
- `components/layout/DashboardNav.tsx` — My MapAble link when flag enabled
- `components/marketing/MapAbleCareCombinedHomepage.tsx` — homepage section
- `tests/a11y/mapable-go.spec.ts` — Prettier (unrelated fix)

## 4. Data model changes

**Migration:** `20260822120000_personal_agency_life_intent`

```prisma
LifeIntent {
  id              String @id @default(cuid())
  principalId     String
  originalExpression String  // preserved verbatim; never overwritten by AI
  status          LifeIntentStatus @default(EXPLORING)
  desiredOutcomes String[] @default([])
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  principal       User @relation("LifeIntents", ...)
}
```

First-run setup stored in existing `AccessibilityProfile.digitalPreferences.paiSetup` JSON (no new table).

Audit events reuse `AuditEvent`: `PAI_LIFE_INTENT_*`, `PAI_SETUP_COMPLETED`, `PAI_LIFE_INTENT_EXPLORE`.

## 5. Route map

| Route | Gate | Notes |
|-------|------|-------|
| `/` | G0 | Public homepage + My MapAble section |
| `/personal-agency` | G0 | Public explainer |
| `/accessibility-map`, `/go`, etc. | G0 | Unchanged public access |
| `/login`, `/register` | G0 | Auth |
| `/my` | G1 auth + `MAPABLE_PERSONAL_AGENCY_UI` + `MAPABLE_MY_MAPABLE_HOME` | Intent-led home |
| `/my/life`, `/my/life/new`, `/my/life/[id]` | G2 + `MAPABLE_LIFE_INTENTS` | Life intents |
| `/my/control`, `/my/control/activity`, `/my/control/permissions` | G2 + `MAPABLE_AGENCY_CONTROL` | Privacy & agency |
| `/my/people`, `/my/devices`, `/my/ask`, `/my/more`, `/my/setup` | G2 UI flag | Capability surfaces |
| `/dashboard/*` | G1+ | Legacy — unchanged |

## 6. Auth / gating matrix

| Level | Enforcement | This slice |
|-------|-------------|------------|
| G0 Public | No auth | Public pages, explainer, accessibility map |
| G1 Account | `requireAuth()` | Account routes, dashboard |
| G2 Personal Agency | `requirePersonalAgencyGate()` + flags | `/my/*` server layout |
| G3 Permissioned service | Role + consent + flags | Links only; no new global enablement |
| G4 Consequential | `AgencyConfirmation` primitive | UI only; not wired to execution |
| G5 Regulated | Human authority | Not implemented |

**Security:** All `/my` routes use server-side `requirePersonalAgencyGate()` in layout. API routes check auth + flags. Life intents scoped by `principalId`.

## 7. Feature flags (default OFF)

| Env var | Purpose |
|---------|---------|
| `MAPABLE_PERSONAL_AGENCY_UI` | Enables `/my` routes (master) |
| `MAPABLE_MY_MAPABLE_HOME` | Intent-led `/my` home (else redirect `/dashboard`) |
| `MAPABLE_LIFE_INTENTS` | Life intent CRUD + API |
| `MAPABLE_AGENCY_CONTROL` | Privacy & control surfaces |
| `MAPABLE_PAI_FIRST_RUN` | Progressive setup at `/my/setup` |

## 8. Accessibility test results

- Playwright: `tests/a11y/my-mapable.spec.ts` — public explainer, unauthenticated `/my` → login
- Authenticated shell test skipped without `A11Y_PARTICIPANT_STORAGE`
- Components: skip link via `MapAbleAppShell`, focus rings, min touch targets (44px), dialog with Escape, landmark headings, no timed confirmations

## 9. Unit / integration / e2e results

```bash
pnpm type-check                                    # pass
pnpm test tests/personal-agency                    # 4/4 pass
pnpm ci:production-claims                          # pass (144 files)
ESLINT_CI_LIGHT=1 eslint components/personal-agency lib/personal-agency app/my app/api/my  # pass
pnpm format:check                                  # pass
```

## 10. Typecheck / lint

- `pnpm type-check` — pass
- Targeted ESLint on PAI paths — pass
- Full `pnpm lint:lib` / `pnpm lint:components` — pre-existing failures in `lib/ads/*` (unrelated)

## 11. Claim-safety review

- Public explainer: “being developed”, no claim of full PAI live
- Homepage section: honest pilot/development language
- Care/Transport/Jobs quick actions link to existing dashboard routes (pilot state preserved)
- No autonomous agent execution claims
- `ci:production-claims` scan passes

## 12. Security / privacy review

- No new consent or audit systems — reuses `AuditEvent`, delegate infra, `AccessibilityProfile`
- Life intent `originalExpression` never overwritten by AI summaries
- API routes require auth + principal scoping
- No secrets in client bundles
- No diagnosis-first onboarding; no mandatory location sharing
- `AgencyConfirmation` has no auto-confirm, no timers, Cancel always available

## 13. Known limitations

- Feature flags default OFF — enable in env for preview/staging
- `AgencyConfirmation` not wired to live G4 actions
- `/my/people` read-only where delegate infra incomplete
- `/my/devices` UX foundation only — no hardware integration
- Assistant wraps existing `GuidedSearchDialogue`; no external execution
- Information density (STANDARD/SIMPLER/DETAILED) not implemented
- Pre-existing CI failure: `access-graph-observation-service.test.ts` (date expiry)

## 14. Deferred capabilities

- Full mobility intelligence platform schema
- Provider marketplace / auto-contact
- Financial execution, bookings, spend
- Physical device control / telemetry
- Autonomous agent orchestration
- G5 regulated decisions
- Canonical `/my` replacing `/dashboard`
- Information density adaptation UI

## 15. Rollback plan

1. Set all `MAPABLE_*` PAI flags to `false` (or unset)
2. `/my` redirects to `/dashboard`; APIs return 404
3. Migration is additive — optional down migration to drop `LifeIntent`
4. No changes to public routes or dashboard behavior when flags off

## 16. Screenshots

Captured in PR / agent artifacts when dev server run with flags enabled.

## 17. Commands run

```bash
pnpm exec prisma generate
pnpm exec prisma validate
pnpm type-check
pnpm test tests/personal-agency
pnpm ci:production-claims
pnpm format:check
ESLINT_CI_LIGHT=1 NODE_OPTIONS='--max-old-space-size=8192' pnpm exec eslint \
  components/personal-agency lib/personal-agency app/my app/api/my --max-warnings 0
pnpm db:migrate:deploy   # required in environments using Life Intents
```

**Enable slice in preview:**

```env
MAPABLE_PERSONAL_AGENCY_UI=true
MAPABLE_MY_MAPABLE_HOME=true
MAPABLE_LIFE_INTENTS=true
MAPABLE_AGENCY_CONTROL=true
MAPABLE_PAI_FIRST_RUN=true
```

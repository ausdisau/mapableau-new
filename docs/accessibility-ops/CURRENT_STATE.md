# AccessibilityOps — Current state inventory

**Inspected:** 2026-07-16  
**Branch basis:** `main` @ `eb52b9f0` plus this foundation branch

## On main today

| Domain | Location | AccessibilityOps decision |
| --- | --- | --- |
| User / Organisation | `prisma` `User`, `Organisation`, `OrganisationMember` | Reuse tenancy |
| Preferences | `AccessibilityProfile` | Reuse; not passport |
| Places | `AccessPlace` + features/sources/floor plans | Canonical place; asset `canonicalDomainRef=access_place:{id}` |
| Indoor ops | `lib/indoor-accessibility/*`, iterations 2–14 partial | Compose incidents/routes/evidence |
| Visit plans | `VisitPlan` | Authorised journeys; privacy-gated later |
| Safety incidents | `IncidentReport`, `/dashboard/safety` | Canonical; optional extension later |
| Indoor incidents | `IndoorAccessibilityIncident` | Compose; no second DB |
| Accreditation | `AccessAccreditation*` | Assessor verification domain |
| Moderation | `AccessModerationQueue/Decision` | Dispute/content trust |
| Audit | `AuditEvent`, `lib/audit/audit-event-service.ts` | Consequential AccessibilityOps actions |
| Access guides | `lib/resources/access-guides-data.ts` | Public guide assets |
| Design system | `docs/design-system.md`, `lib/brand/*` | First rule seeds |
| Accessibility statement | `/accessibility-statement` | Correctly non-certifying |
| Testing | Vitest + eslint-plugin-jsx-a11y | No Playwright/axe suite on main historically |
| Access Intelligence page | `app/access-intelligence/page.tsx` | Marketing demo only |
| Worker reliability | `lib/reliability` | Do **not** reuse for access reliability |

## Unmerged remotes (compose, do not fork)

| PR / branch | Content |
| --- | --- |
| #273 `access-intelligence-expansion-6ea8` | Engines, regression, reliability, widget/SDK docs |
| #266 AI place binding | AccessPlace binding prerequisite |
| #265 physical systems | Sensors/simulator — no actuation in AccessibilityOps |
| #267–#275 AURA waves | CareOSMission, proposals, Pocket, Guardian, Stop |
| #231 Intelligence Fabric / CareOS | Mission network alignment |
| #279 shared-programme-foundation | Programme scaffolding |

## Gaps filled by Wave 1

- `AccessibilityAsset` (+ version, dependency, owner)
- `AccessibilityRule` (+ version, applicability, standard source)
- Shadow evaluation + reason codes
- Signed runner ingest (shadow)
- Composition adapters for AI / AURA
- Ops dashboard (read-only)

## Explicitly not migrated in Wave 1

Existing incidents, accreditation cases, moderation queues, public reliability claims, release blocking.

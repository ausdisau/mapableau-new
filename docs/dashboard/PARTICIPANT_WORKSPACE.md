# Participant workspace (My Day + left nav)

**Branch track:** dual with Ads Manager (`cursor/ads-participant-dual-a264`)  
**Base SHA at start:** `c4e5a777`  
**Status:** Proposed — do not enable AI or claim WCAG compliance without human review.

## Navigation schema

Typed config: [`lib/dashboard/participant-nav.ts`](../../lib/dashboard/participant-nav.ts)

| Group | Items (existing routes) |
|-------|-------------------------|
| Your life | `/dashboard`, `/care`, `/dashboard/transport`, `/dashboard/bookings` (+ calendar), `/dashboard/find-support`, `/dashboard/messages` |
| Your information | `/dashboard/profile`, `/dashboard/accessibility` (+ support-profile), `/dashboard/billing` (+ invoices/funding/documents) |
| Choice & safety | `/dashboard/consent`, `/dashboard/settings/notifications`, `/dashboard/safety` (+ engagement/incidents) |

Admin link (`/admin`) is server-role gated (`mapable_admin`) and kept outside everyday groups.

## Shell

[`DashboardAppShell`](../../components/layout/DashboardAppShell.tsx) uses `@mapable/ui` `SidebarLayout` (single `main#main-content`) when `MAPABLE_PARTICIPANT_WORKSPACE_SIDEBAR` is not `"false"`. Set that env to `false` to restore the previous horizontal `DashboardNav` via `MapAbleAppShell`.

## My Day rules (programmatic default)

[`lib/dashboard/my-day-status.ts`](../../lib/dashboard/my-day-status.ts) maps care/transport statuses to `confirmed | pending | cancelled | unknown`. Empty states offer discover/help links — never synthetic bookings.

## Optional AI view

`MAPABLE_PARTICIPANT_MY_DAY_AI_ENABLED=true` plus CareOS enabled shows a **read-only** panel with sources, freshness, uncertainty, and explicit no-action-taken notice. Default off. No autonomous writes.

## Human review gates

- Accessibility (WCAG 2.2 AA + AT manual)
- Privacy / consent / purpose limitation for any AI expansion
- Safety copy for cancelled care / pending transport scenarios

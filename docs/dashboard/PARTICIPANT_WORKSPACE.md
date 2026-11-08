# Participant workspace (My Day + left nav)

**Branch track:** dual with Ads Manager (`cursor/ads-participant-dual-a264`)  
**Base SHA at start:** `c4e5a777`  
**Status:** Proposed — do not enable AI or claim WCAG compliance without human review.

## Concept reference

Interaction and visual hierarchy come from the participant dashboard prototype zip
(`IMPLEMENTATION-PROMPT.txt` + `index.html`). That HTML is **not** production code
and its demonstration scenarios are **not** real user data. Live My Day reads
authorised MapAble records only.

## Navigation schema

Typed config: [`lib/dashboard/participant-nav.ts`](../../lib/dashboard/participant-nav.ts)

| Group | Items (existing routes) |
|-------|-------------------------|
| Your life | Home / My Day, My Care & Support, My Transport, Bookings & Calendar, Find Places & Services, Messages |
| Your information | Personal Details, Support & Accessibility, Payments & Agreements |
| Choice & safety | Privacy, Consent & Delegates, Account & Security, Help & Safety |

Admin link (`/admin`) is server-role gated (`mapable_admin`) and kept outside everyday groups. Hrefs are unchanged; labels match the concept wording.

## Shell

[`DashboardAppShell`](../../components/layout/DashboardAppShell.tsx) uses `@mapable/ui` `SidebarLayout` (single `main#main-content`) when `MAPABLE_PARTICIPANT_WORKSPACE_SIDEBAR` is not `"false"`. Set that env to `false` to restore the previous horizontal `DashboardNav` via `MapAbleAppShell`.

## My Day layout

[`MyDayWorkspace`](../../components/dashboard/MyDayWorkspace.tsx) implements the concept hierarchy:

1. Hero + **view picker** (`role="group"`, `aria-pressed`) — Programmatic (default) or AI-Assisted
2. Two-column grid — **What needs attention** + **Coming up** | mode side panel
3. **Common actions** cards (care / transport / preferences)
4. Compact **More tools** legacy deep links

### Attention rules (programmatic)

[`buildAttention`](../../lib/dashboard/my-day-status.ts) derives narrative from the snapshot:

| Situation | Level | Behaviour |
|-----------|-------|-----------|
| No records | neutral | Discover / help CTAs — never fabricate schedules |
| Care cancelled | bad | Review care; transport left untouched unless separately pending/cancelled |
| Transport pending | warn | Never describe the trip as booked |
| Care pending | warn | Not a booked visit |
| Confirmed arrangements | ok | Routine “up to date” framing |

Statuses map to `confirmed | pending | cancelled | unknown` via care/transport raw status sets.

## Optional AI view

`MAPABLE_PARTICIPANT_MY_DAY_AI_ENABLED=true` plus CareOS enabled shows a **read-only** panel with sources, freshness, uncertainty, and explicit no-action-taken notice. Default off. Selecting AI-Assisted in the picker when flags are off shows why the view is unavailable; Help & Safety stays reachable. No autonomous writes.

## Human review gates

- Accessibility (WCAG 2.2 AA + AT manual)
- Privacy / consent / purpose limitation for any AI expansion
- Safety copy for cancelled care / pending transport scenarios

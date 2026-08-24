# Manual accessibility script — Relational Navigator pilot

Use this checklist when validating WCAG 2.2 AA behaviour for relational UX changes in `NavigatorPilotJourney` and `DecisionPassportPanel`. Automated Playwright a11y tests exist; this script covers participant-control flows that need human verification.

## Prerequisites

- Local preview: `pnpm dev` (or `raisely local` if campaign-scoped)
- Flags for pilot testing (non-production only):
  - `MAPABLE_NAVIGATOR_PILOT_ENABLED=true`
  - `MAPABLE_NAVIGATOR_PILOT_MATCHING=true`
  - Optional: `MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED=true`

## Steps

1. **Navigate** to `/navigator/pilot` (or configured pilot route).
2. **Goal step**
   - Tab to goal textarea; confirm visible focus ring.
   - Enable "Prefer no AI assistance"; confirm assistance mode select disables.
   - Change assistance mode; confirm label association via `htmlFor`.
3. **Confirm step**
   - Screen reader: "We understood" summary is announced.
   - AI involved line reflects opt-out state.
4. **Constraints step**
   - Non-negotiable checkboxes are keyboard operable.
   - Permitted fields list matches communication passport disclosable keys.
5. **Results / NO_SAFE_MATCH**
   - When no match: human help CTA is reachable by keyboard.
   - Status message uses plain language (no chain-of-thought).
6. **Decision Passport panel**
   - Expand/collapse works with keyboard.
   - Correct / reject / opt-out routes are labeled.
7. **Provider Finder gate (API)**
   - With `SEARCH_AGENT_ENABLED=false`, chat returns deterministic stream (no ungated model stream).

## Record

- Date, tester, browser, assistive tech
- Pass/fail per step
- Screenshots for any failures

## Fail criteria

- Focus trap or missing focus indicator
- Unlabeled form controls
- AI claims without opt-out path
- Ungated model stream when flags off

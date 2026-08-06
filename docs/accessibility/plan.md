Accessibility Plan — Transport UI refactor

Date: 2026-08-07
Branch: ausdisau-mapable-architecture-audit

Overview

This plan records completed accessibility work for Transport UI and next steps. The goal is to make Transport booking and provider dispatch flows accessibility-first (screen-reader announcements, keyboard navigation, motion-respecting behavior, and E2E audits).

Completed

- Added live region announcer and announce() calls in:
  - components/transport/NewTransportTripForm.tsx
  - components/transport/ProviderTripDispatchPanel.tsx
  - components/transport/TransportTripActionDialogs.tsx
- Added keyboard navigation and focus targets to trip lists:
  - components/transport/ProviderTripDispatchPanel.tsx (ArrowUp/Down/Home/End)
  - components/transport/TransportTripListItem.tsx (Enter/Space activation, aria-selected)
- Motion-aware focus timing using useMotionPreferencesSafe across affected components.
- Committed and pushed changes to branch: ausdisau-mapable-architecture-audit

Files changed (high level)

- components/transport/NewTransportTripForm.tsx
- components/transport/ProviderTripDispatchPanel.tsx
- components/transport/TransportTripListItem.tsx
- components/transport/TransportTripActionDialogs.tsx

Remaining and next steps

1. E2E Accessibility tests (Playwright + Axe)
   - Create tests covering: trip request flow, dispatch assign, accept, cancel, dispute flows
   - Add projects to playwright.config.ts and CI pipeline
   - Todo: a11y-dispatch-e2e

2. Manual validation
   - Screen reader checklist (NVDA, VoiceOver) for dispatch and booking flows
   - Keyboard-only walkthrough and focus order verification

3. Team adoption and docs
   - Update migration guide with patterns used (announce, live region, motion-safe focus)
   - Run short training session (a11y-team-training)

4. Additional improvements
   - Map animation review: ensure map interactions respect reduce-motion
   - Performance review: measure subscription costs from Zustand usage in high-traffic components

Status updates performed

- Marked a11y-transport-ui as done (transport UI refactor)
- Created follow-up todo a11y-dispatch-e2e (pending)

Notes

Keep the reference implementation (CareRequestWizardRefactoredV2) available as a pattern for team training. Prioritize E2E tests next — they will catch issues screen readers can surface only in real browsers.


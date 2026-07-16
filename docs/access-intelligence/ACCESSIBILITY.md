# Access Intelligence — Accessibility

Target: WCAG 2.2 AA for Access Intelligence surfaces.

## Implemented patterns

- Skip link into main content
- Landmarks and heading hierarchy
- Keyboard-operable controls (min ~44px touch targets via `min-h-11`)
- Visible focus rings (`mapableCareFocusRing`)
- Status not by colour alone (icon + text label)
- Live regions for streaming (“Checking access evidence…”)
- Approval dialogs as `alertdialog` with initial focus
- Map-free route ordered lists and print visit plan
- Reduced-motion: prefer CSS transitions already gated by design system; no autoplay
- Chat is not the only path: Explore, Passport, Pulse, Visit Plans, Venue Studio, place pages

## Plain language

Copy prefers short sentences. Templates include a disclaimer that needs are individual.

## Remaining hardening

- Formal axe/Playwright suite when Playwright is added to the repo
- Venue Studio production keyboard matrix for remediation tables
- Optional high-contrast theme tokens if MapAble Care adds a dedicated mode

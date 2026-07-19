# Access Independence MVP — QA notes

This document covers the Access Independence MVP (passport, preflight, step-by-step care request, drafts, barrier reports, map/list equivalence, consistent help, panel extensions).

**Important:** Meeting these checks does not claim WCAG 2.2 AA compliance for the whole product. Automated scans and the Accessibility Panel are helpers only.

## Manual accessibility checklist

### Assistive technology

- [ ] **NVDA + Chrome or Firefox**: open Access Passport, change a share category, confirm “You are sharing…” status is announced; complete Care Request steps with virtual cursor and browse mode off for forms.
- [ ] **VoiceOver + Safari**: same flows; verify dialogs (Accessibility Panel, Consistent Help) announce name, trap focus, restore focus on close.
- [ ] Confirm Access Preflight fact states (Confirmed / Unavailable / Unknown / Not applicable) are spoken with labels, not colour alone.

### Keyboard only

- [ ] Tab through map landing: map/list toggle, place list, selected place, Access Preflight, Report barrier link, Consistent Help.
- [ ] Complete Care Request wizard: Back / Continue never auto-advance on chip select; review screen before submit; error summary links move focus to fields.
- [ ] Barrier report: choose category, enter description, skip image, submit; receive reference number.
- [ ] Open/close Accessibility Panel and dialogs with Escape; focus returns to trigger.

### Voice control

- [ ] Visible names match spoken names for primary actions: “Continue”, “Save and continue later”, “Report an access barrier”, “Open accessibility settings”.

### Zoom and spacing

- [ ] 200% and 400% browser zoom on map landing and Care Request: no clipped controls; list view usable when map is constrained.
- [ ] Increase text spacing (browser/extension): no overlapping labels on passport and barrier form.

### Motion, contrast, touch

- [ ] OS reduced motion: decorative motion stays off even if panel reduce-motion is unset.
- [ ] High contrast / forced colours: status text and icons remain readable; markers not colour-only.
- [ ] Touch targets: primary controls at least 44×44 CSS px where large-controls is on; minimum 24×24 otherwise.

### Cognitive / plain-language walkthrough

- [ ] Task: “Share only mobility needs with Clinic A until next Friday.”
- [ ] Task: “Check whether this place has a Changing Places toilet before I go.”
- [ ] Task: “Start a care request, leave halfway, sign in again, resume.”
- [ ] Task: “Report a lift barrier without uploading a photo.”

## Privacy checks

- [ ] UI panel settings do not appear in provider-facing share payloads.
- [ ] Consent audit events log categories/active flags only — not requirement values.
- [ ] Barrier reports do not expose reporter contact details on public place pages.
- [ ] Anonymous report path works without a session when policy allows.

## Auth review notes

| Requirement | Status |
| --- | --- |
| Password managers / autofill | Supported (`autocomplete` on email/password) |
| Copy/paste allowed | Supported (no paste blocking) |
| Passkeys | Available via “Login with passkey” |
| Email magic links | **Not implemented** — NextAuth Email provider not configured; would need provider + migration work |
| Errors preserve identifier | Email retained in controlled inputs on failure |
| Focus after errors | Error region receives focus |
| Drafts across session expiry | Local drafts for signed-out users; account drafts via `/api/form-drafts` when signed in |

## Commands

```bash
pnpm db:generate
pnpm exec tsc --noEmit
pnpm exec vitest run tests/access-independence tests/accessibility
pnpm exec playwright test tests/a11y/accessibility-panel.spec.ts
```

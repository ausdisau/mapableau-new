# Accessibility evidence — My Day Resilience Simulator

**Target:** WCAG 2.2 AA for the critical demo flow.  
**Claim status:** In development — automated checks and structural contracts only. **Not** an independent conformance certification.

## Automated evidence (this branch)

| Check | Command | Result (local) |
|---|---|---|
| Engine + a11y contract Vitest | `pnpm --dir apps/web exec vitest run tests/my-day-resilience` | 22 passed |
| Node 22 structural contract | `node --experimental-strip-types --test apps/web/tests/my-day-resilience/my-day-resilience.contract.test.mjs` | 6 passed |

## Structural UI contracts covered

- `aria-live="polite"` status region
- Section headings via `aria-labelledby`
- `min-h-11` controls (large targets)
- Non-map list plan + offline-readable summary (no-AI / no-map equivalence path)
- Textarea goal editing for AAC/text entry
- Single-column `max-w-3xl` + `flex-wrap` for 200–400% reflow intent (320px equivalent)
- Demo-only `role="status"` banner
- Colour is not the sole status channel (honesty labels use text)

## Manual checklist still required before any release claim

- [ ] Keyboard-only full journey
- [ ] Screen reader (VoiceOver / NVDA) announcement of phase and receipt
- [ ] Switch / AAC composition pause behaviour with real AT
- [ ] 200% and 400% browser zoom on the live page
- [ ] High contrast / forced-colors
- [ ] Reduced motion
- [ ] Consent deny / withdraw announced accessibly

Do not state “WCAG 2.2 AA compliant” until independent review completes.

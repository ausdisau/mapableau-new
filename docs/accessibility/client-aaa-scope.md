# Vite client AAA scope

## CI inclusion

The authenticated Vite twin (`client/`) is **explicitly excluded** from the Next
Playwright Accessibility CI workflow (`.github/workflows/accessibility.yml` →
`pnpm test:a11y`). That suite boots the Next.js app on port 3000 and does not
serve Vite SPA routes (`/invoices`, `/payment-methods`, grocery checkout, geo
map, worker shifts, etc.).

Axe AAA automation for Vite routes remains excluded until a stable Vite preview
(or equivalent) can be wired into `playwright.config.ts`. The Replit/Vite
CJS/ESM breakage is tracked separately.

## WS5 coverage (this branch)

- Radix `Dialog` for Stripe/BECS payment overlays and start-shift (Esc, focus
  trap, focus return). Payment flows use `Dialog`, not `AlertDialog`.
- `MapView`: removed `role="application"`; synchronised text/list alternative;
  keyboard-operable markers with 44×44 hit targets; hex-only colour sanitisation
  for pin HTML; `escapeHtml` retained on popups.
- Interactive targets in touched surfaces sized to ≥44×44px; dual focus ring
  tokens come from the AAA tokens branch.

Manual keyboard / screen-reader checks remain required before claiming client AAA.

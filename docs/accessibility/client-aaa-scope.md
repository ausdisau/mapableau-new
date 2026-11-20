# Vite client AAA scope

The authenticated Vite twin (`client/`) is **not** served by the Next Playwright
Accessibility CI workflow today (Replit/Vite CJS/ESM breakage tracked separately).

WS5 therefore:

- Uses Radix `Dialog` for payment and shift overlays (Esc, focus trap, focus return).
- Provides a synchronised text list for `MapView` and removes `role="application"`.
- Sanitises map icon colours to `#RGB` / `#RRGGBB` only.

Axe AAA automation for Vite routes is **explicitly excluded** from CI until a
stable Vite preview server can be wired into `playwright.config.ts`. Manual
keyboard / screen-reader checks remain required before claiming client AAA.

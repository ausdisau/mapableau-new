# Accessibility acceptance — Access Infrastructure UI/API

**Target:** WCAG 2.2 AA  
**Automated:** use repo Playwright a11y (`pnpm test:a11y`) when My Access UI ships  
**This slice:** primarily API + engine; transport/compatibility responses use text states (not colour-only)

## Required when UI lands

- Keyboard operation and visible focus
- Screen-reader semantics for four compatibility states (icon + text)
- 200% zoom / reflow
- Accessible forms for requirement CRUD
- Accessible consent / disclosure review
- No colour-only status
- Reduced motion
- Save-and-return where practical
- Human support path

## Manual validation still required

| Check | Status |
| --- | --- |
| Keyboard-only passport CRUD | NOT RUN (UI deferred) |
| NVDA / screen reader | NOT RUN (UI deferred) |
| 200% zoom | NOT RUN (UI deferred) |
| Narrow mobile viewport | NOT RUN (UI deferred) |
| Automated axe/playwright on My Access | NOT RUN (UI deferred) |

Do not claim WCAG conformance from automated tooling alone.

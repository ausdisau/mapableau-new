# Security & accessibility evidence (Coverage Care pilot)

## Security regressions covered (automated)

| Case | Location |
|---|---|
| Host reserved / forged / unknown never activate | `tests/tenancy/host-policy.test.ts` |
| Preview default OFF; rewrite gated | `tests/tenancy/preview-policy.test.ts`, `tests/tenancy/host-routing.test.ts` |
| Cross-tenant isolation (Coverage Care vs Acme) | `tests/tenancy/enquiry-journey.test.ts` |
| Enquiry create / amend / withdraw / delete + provider revocation | `tests/tenancy/enquiry-journey.test.ts` |
| Platform admin cannot own/read participant enquiry by role alone | `tests/tenancy/permissions.test.ts` |
| NDIA capabilities all denied | `tests/tenancy/ndia-capabilities.test.ts` |
| Marketing vs service consent independence (synthetic) | `tests/tenancy/enquiry-journey.test.ts` |
| Ads / GA / MapAble JSON-LD suppressed on `/t/*` | Root layout reads `x-mapable-tenant-preview` |

## Accessibility (automated + blockers)

| Check | Result |
|---|---|
| Landmarks + skip link on tenant shell | Covered in `tests/coverage-care/a11y-landmarks.test.tsx` / shell structure |
| Keyboard-oriented enquiry smoke | Enquiry controls use native focusable controls + visible focus rings |
| Mobile viewport 320/375 | Manual / Playwright smoke when CI allows; shell is fluid `max-w` layout |
| AAC / switch access human lab | **BLOCKER — unaudited** in this pilot. Do not claim WCAG conformance for AAC/switch until lab evidence exists |
| Diagnosis disclosure | Never mandatory in enquiry UX |

## Explicit non-claims

- No verified NDIS registration or practitioner credentials on catalogue cards
- No live payments, bookings, or NDIA submissions
- Synthetic banner: `SYNTHETIC DEMO — NOT LIVE`

## Local baseline notes

- Focused Vitest suites under `tests/tenancy` are the gate for this PR
- Full-repo `pnpm build` may fail on pre-existing eslint outside Coverage Care; CI-mode `GITHUB_ACTIONS=true` build is the project baseline

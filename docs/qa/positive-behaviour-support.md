# QA — Positive Behaviour Support

## Automated suites

- Vitest: `tests/positive-behaviour-support/foundation.test.ts`
- Playwright/axe: `tests/a11y/positive-behaviour-support.spec.ts`

## Minimum coverage checklist

- [x] Participant self access
- [x] Delegates require valid grant; expired/revoked denied
- [x] Practitioners scoped to assignment + organisation
- [x] Implementing providers get implementation fields only
- [x] Unrelated organisations denied
- [x] Ambient admin clinical denial; break-glass allowed
- [x] Feature-disabled refusal
- [x] Unknown answers remain unknown
- [x] Questionnaire ≠ FBA / cannot finalise alone
- [x] AI cannot determine function or handle RP
- [x] External boundary rejects PII / unapproved free text
- [x] Model cannot write final/active plans
- [x] Finalisation gates; immutability; RP activation block
- [x] Sensitive values stripped from audit metadata
- [x] Public landing a11y (axe WCAG 2.2 AA critical/serious)

## Manual validation (human)

1. Enable only `MAPABLE_PBS_ENABLED` in a non-production environment.
2. Walk questionnaire with keyboard-only + screen reader.
3. Confirm Easy Read mode, skip, and “I don’t know”.
4. Attempt RP screening → practitioner review item; AI drafting suspended.
5. Confirm exports show draft status and non-lodgement notice.
6. Confirm admin governance page shows counts only without break-glass.

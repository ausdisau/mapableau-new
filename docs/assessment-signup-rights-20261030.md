# MapAble participant assessment onboarding — implementation note

Status: draft PR, not a live or authorised NDIA assessment. Base: main @ 7008ab6dc749ba666f5a75714d0b110814287f03.

## Routes
- `/assessment`: public explainer, no sensitive disclosure required
- `/signup/assessment`: signup alias to `/register?flow=assessment`
- `/signup`: standard signup alias
- `/register/assessment`: authenticated optional self-report
- `/register/support-needs`: legacy redirect for bookmarks
- `/dashboard/assessment`: participant-authenticated assessment hub
- `/dashboard/assessment/review`: session-only concern register and manual text export

## Protection and domain ownership
- Account creation uses existing `/api/register`, NextAuth credentials/OAuth, and participant roles.
- Support needs submission uses `/api/participants/support-needs`, existing per-account database and audit path.
- Non-participant roles retain role redirects. Invited workers retain their dedicated onboarding.
- Self-report snapshots are explicitly labelled and cannot imply completion of I-CAN v6.
- Unselected life areas are not assessed, not 'none'. WHODAS/Vineland/I-CAN formal results must be separate professionally sourced evidence records.
- No NDIA transmission or eligibility, clinical severity or budget scoring.
- Report comparison is local to a session, not an account-persisted correction workflow. No invented official assessor report, no automatic disagreement inference.
- Existing database model is reused to avoid requiring a schema migration; model/table naming is historical and not a representation of formal I-CAN administration.
- Opt-out is allowed. Signing up is not contingent upon health or disability disclosure.

## Risks and gates
The repository already has tests expecting the former pseudo-I-CAN transformation. Replace those tests with snapshot-provenance assertions and review any consumers that expect `payload.domains` before merge. Preserve historic stored payloads; do not backfill missing areas as 'none'. Privacy review needed for retention, deletion, consent withdrawal, export access, and secure storage. Existing simplified 'intensity' self-report is not a validated metric.

Run: `pnpm exec vitest run tests/intake/participant-support-snapshot.test.ts tests/intake/support-needs-api.test.ts tests/intake/register-support-needs-redirect.test.ts`, `pnpm type-check`, `pnpm lint:app-rest`, `pnpm lint:components`, `pnpm lint:lib`, `pnpm test:a11y`. Also do manual keyboard, screen reader, zoom and AAC testing.
Before production release: enforce consent-gated data access and retention, no forced assessment, no unapproved disclosure, and risk review by participant representatives.

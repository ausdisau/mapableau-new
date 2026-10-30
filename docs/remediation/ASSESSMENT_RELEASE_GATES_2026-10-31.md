# Assessment remediation: four release gates

**Status:** Draft; production release NO-GO.  
**Checked:** 31 October 2026 (Australia/Sydney).  
**Repository:** `ausdisau/mapableau-new`.  
**Baseline:** `main` commit `3970c318` (merged PR #630).

## Decision

Keep MapAble Assessment closed to new sensitive submissions until all four gates
pass and an accountable human owner authorises release. This is a participant-authored
planning tool, not an official NDIA assessment or a WHODAS, Vineland or I-CAN score.

Draft PR #631 is not a production deployment, a security certificate or an
authorisation to collect personal health or disability information.

## Evidence

- CI: [failed lint on merged main](https://github.com/ausdisau/mapableau-new/actions/runs/41042249541).
- Quality: [three failures on main](https://github.com/ausdisau/mapableau-new/actions/runs/41042249555).
- Security: [expired exceptions](https://github.com/ausdisau/mapableau-new/actions/runs/41042249551).
- Accessibility: [93 passed, three skipped](https://github.com/ausdisau/mapableau-new/actions/runs/41042249570).
- Database migration and CSP preview jobs passed on merged main.
- Vercel assessment deployment at the merged SHA is not verified.

## Gate 1: CI and dependency security

This draft fixes existing import-order and unused-import errors. It corrects the
explicit connection-language match and updates delegate tests to require an
actual, active participant consent. The invalid generic `read` scope remains
rejected; financial and clinical authority are not expanded.

The security exceptions in `security/advisory-allowlist.json` all expired on
11 September 2026. They remain unchanged and are still blocking. The following
are advisory-specific published patch targets, **not** proof that the complete
installed dependency graph is safe:

- `GHSA-88fw-hqm2-52qc` — `hono`: patch from `4.12.25`.
  [Source](https://github.com/advisories/GHSA-88fw-hqm2-52qc).
- `GHSA-v2hh-gcrm-f6hx` — `fast-uri`: `2.4.3`, `3.1.4` or `4.1.1`.
  [Source](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx).
- `GHSA-4c8g-83qw-93j6` — `fast-uri`: `2.4.2`, `3.1.3` or `4.0.1`.
  [Source](https://github.com/advisories/GHSA-4c8g-83qw-93j6).
- `GHSA-7p8r-x3mc-p8w7` — `fast-uri`: `2.4.4`, `3.1.5` or `4.1.2`.
  [Source](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7).
- `GHSA-mwp4-54f8-5fhr` — `ip-address`: `10.3.1`.
  [Source](https://github.com/advisories/GHSA-mwp4-54f8-5fhr).
- `GHSA-2m8v-j782-fhvr` — `socket.io-parser`: `4.2.7` for 4.x.
  [Source](https://github.com/advisories/GHSA-2m8v-j782-fhvr).
- `GHSA-2v37-7h3g-55p8` — `nanoid`: `3.3.18` or `5.1.6`.
  [Source](https://github.com/advisories/GHSA-2v37-7h3g-55p8).
- `GHSA-ggr8-5vv4-36mx` — `deepmerge-ts`: `8.0.0` is a
  major-version update; check Prisma compatibility.
  [Source](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).

**Security owner:** Verify exact installed versions with `pnpm why` and
`pnpm audit --prod --json`, upgrade compatible parents or overrides, test
regressions and rerun the audit. Check newer advisories, particularly for
`fast-uri`. No blanket waiver renewal is permitted.

The active GitHub `main` ruleset contains signature and history constraints
but did not expose required status checks. Branch-protection inspection was
denied (HTTP 403). An administrator must confirm required approval and
passing CI, Quality, Security, Accessibility, CSP, CodeQL and migration checks.
No repository-rule changes were made.

## Gate 2: Participant information and consent

**Implemented as a draft:** `MAPABLE_ASSESSMENT_INTAKE_ENABLED` is off by
default. New intake POST calls fail closed with HTTP 503 unless explicitly
enabled. The authenticated participant owns their record. Consent validation,
participant scope, excluded skip records and legacy provenance have synthetic
tests.

**Unverified and blocking:**

- Separate, revocable purpose-specific consent receipt and suppression of
  future processing after withdrawal.
- Encryption in transit and at rest; key management, backups, data residency,
  retention, correction, deletion, export and audit-history access.
- Tenant and recipient-scoped disclosure for every future export and delegate.
- Database-enforced idempotency and transactional submission/audit consistency.
- Shared registration rate limiting with validated proxy headers.
- Historical I-CAN-shaped payloads must not be silently reinterpreted as
  participant self-reports or official scores.

Use synthetic accounts only. No production personal records in CI, previews,
logs or demonstrations.

## Gate 3: Accessible participant testing

Synthetic Playwright checks cover the public entry, authenticated registration,
manual review/export, focus, 320-pixel reflow, reduced motion, access denial and
axe scanning. This does **not** establish WCAG 2.2 AA compliance.

Human testers still need to verify keyboard-only, switches, screen readers,
AAC input, 200–400% text zoom, fatigue breaks, error recovery, meaningful
consent and supported decision-making. Record device, software, user consent,
finding, owner, severity and retest.

**Known gap:** Review drafts are session-only and disappear on reload. A safe
encrypted save-and-resume design is needed before interrupted-session recovery
can pass; current tests only document loss.

## Gate 4: Private preview and production control

The production website's Vercel status for PR #630 was account-blocked.
The account owner must resolve restrictions without exposing real participant
data.

1. Prepare separate synthetic-only staging database and credentials.
2. Keep production assessment flag disabled.
3. Verify preview SHA, tenant boundary, auth redirects, content security
   policy, audit records, backups and access logs.
4. Repeat vulnerability, unit, browser and human accessibility checks.
5. Document rollback and incident contacts.
6. Obtain explicit human release approval for any production activation.

**Release decision: NO-GO.** Nothing in this document changes a live
environment, extends a vulnerability exception, merges a branch, or provides
NDIA assessment authority.

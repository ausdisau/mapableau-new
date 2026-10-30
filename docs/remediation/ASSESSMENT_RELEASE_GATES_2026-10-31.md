# MapAble Assessment — four-gate remediation and release hold

**Status:** Draft remediation; production release **NO-GO**.  
**Evidence date:** 31 October 2026 (Australia/Sydney).  
**Repository:** `ausdisau/mapableau-new`.  
**Baseline main:** `3970c318f1bc2e18f46cabdddb2624b9e88c045b` (merged PR #630).

## Decision and scope

Keep registration self-report and assessment comparison disabled for new sensitive submissions
until CI, vulnerability remediation, participant-data governance, human accessibility testing,
and a verified preview deployment have all been accepted by an accountable release owner.
No NDIA submission, clinical scoring, automated support entitlement, or proprietary
WHODAS/Vineland/I-CAN assessment is authorised here.

This draft branch repairs a subset of software defects and creates synthetic test evidence.
It does **not** approve production activation, update real participant records, change Vercel
billing/account settings, renew security exceptions, or alter GitHub protection rules.

## Evidence ledger

| Claim | Status | Evidence | Confidence | Consequence |
| --- | --- | --- | --- | --- |
| PR #630 is in main | Verified repository | Merge commit `3970c318` | High | Base for remediation |
| Assessment routes exist | Implemented, not production-verified | `app/register/assessment`, `app/dashboard/assessment`, `app/api/participants/support-needs` | High | Protect data intake |
| CI lint failed after merge | Verified CI | [CI #41042249541](https://github.com/ausdisau/mapableau-new/actions/runs/41042249541), 34 errors | High | No-go until green |
| Quality tests failed | Verified CI | [Quality #41042249555](https://github.com/ausdisau/mapableau-new/actions/runs/41042249555), 3 failures | High | Review delegate and Companion |
| Dependency audit failed | Verified CI | [Security #41042249551](https://github.com/ausdisau/mapableau-new/actions/runs/41042249551), eight expired exceptions | High | Keep fail-closed audit |
| Accessibility checks passed | Verified automated subset | [Accessibility #41042249570](https://github.com/ausdisau/mapableau-new/actions/runs/41042249570), 93 passed, 3 skipped | High | Human validation still required |
| Website is live with PR #630 | Unverified | Vercel commit status was account-deployment-blocked | Low | Do not use real participant data |
| Consent, deletion and encryption lifecycle | Unverified | JSON payload and consent flags; no verified dedicated assessment receipt/retention workflow | Medium | Block sensitive production intake |

## Gate 1 — CI and dependency safety

### Code changes proposed on this draft branch

- Correct app API import-order and unused import errors from the baseline lint log.
- Add explicit, user-stated `I feel isolated` to Companion connection guidance matching;
  do not infer loneliness from other queries.
- Update delegate invitation tests to use a valid `profile.read` scope with a separately
  active participant consent. Retain explicit rejection of unknown `read` and
  consent-free delegation. No privileged scopes or production policy widened.
- Run CI again. All checks must pass; don't suppress errors to obtain green status.

### Eight expired security exceptions: patch assessment

Every exception in `security/advisory-allowlist.json` expired on 11 September 2026.
**No exception has been renewed.** The versions below are advisory-specific repair floors,
not a guarantee that a dependency tree is free of other vulnerabilities.

| Advisory | Package | Published patch floor / path | Owner action |
| --- | --- | --- | --- |
| [GHSA-88fw-hqm2-52qc](https://github.com/advisories/GHSA-88fw-hqm2-52qc) | `hono` | `4.12.25`; transitive via MCP | Upgrade compatible agent/MCP chain |
| [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) | `fast-uri` | `2.4.3` / `3.1.4` / `4.1.1` | Upgrade; verify later advisories too |
| [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) | `fast-uri` | `2.4.2` / `3.1.3` / `4.0.1` | Same transitive chain, verify URL-policy handling |
| [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) | `fast-uri` | `2.4.4` / `3.1.5` / `4.1.2` | Later fast-uri advisories also exist |
| [GHSA-mwp4-54f8-5fhr](https://github.com/advisories/GHSA-mwp4-54f8-5fhr) | `ip-address` | `10.3.1`; MCP chain | Upgrade and test SSRF/host validation |
| [GHSA-2m8v-j782-fhvr](https://github.com/advisories/GHSA-2m8v-j782-fhvr) | `socket.io-parser` | `4.2.7` for Socket.IO 4.x | Upgrade realtime app, resource-abuse tests |
| [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | `nanoid` | `3.3.18` / `5.1.6` | Validate Next/PostCSS transitive version |
| [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) | `deepmerge-ts` | `8.0.0` (major-version change) | Check Prisma compatibility; no blind override |

Owner: **Platform Security / dependency maintainers** (human assignments not yet confirmed).
For each advisory, capture installed package version and dependency path from a new
`pnpm audit --prod --json` and `pnpm why`, choose a compatible patch, update lockfile,
run smoke/regression tests, verify new audit, and record a documented acceptance decision.
If no patch is feasible, require a new *independently reviewed*, bounded, demonstrably
effective exception; expired exceptions remain blocking meanwhile.

### Branch-protection action

The visible `main` ruleset has signatures and non-fast-forward controls but no
`required_status_checks` rule. Separate branch-protection settings returned HTTP 403.
A repository administrator must verify and configure required PR review and successful
CI, Quality, Security dependency audit, Accessibility, CSP preview, migrations and CodeQL
checks. Confirm exact check names from live PR results and inspect integration bypass rights.
No ruleset changes have been made by this draft work.

## Gate 2 — Participant-data protections

**Implemented in draft:** default-off `MAPABLE_ASSESSMENT_INTAKE_ENABLED` switch;
participant-authenticated intake; consent validation; session-ownership tests;
read-only historical provenance classifier; skipped records excluded from completed status.
Synthetic records only.

**Still unverified / must be proven before release:**

1. Scope records by authenticated user and tenant on every future read, export and delete route.
2. Specify a separate revocable consent receipt and prevent future processing after withdrawal.
   The current boolean in the JSON payload is not enough evidence of consent-lifecycle control.
3. Verify encryption in transit and at rest, keys and access roles, backups, restore, logs,
   geographic residency and breach-response coverage. Do not assume a Prisma JSON column is encrypted.
4. Approve retention windows, archive/legal-hold process, subject access, corrections and
   permanent deletion/erasure with human review for records on legal hold.
5. Preserve provenance for legacy I-CAN-shaped JSON; never convert unanswered categories to
   `none`, or label a participant's self-report as a professional instrument result.
6. Add database-enforced idempotency and transactional consistency for repeats, retries,
   audit events and ingestion. The current request-time UUID is not a dedupe guarantee.
7. Replace process-local IP rate limiting on public registration with shared, trusted-proxy-aware
   enforcement in multi-instance production infrastructure.
8. Reconcile all accepted support-needs permissions with delegate scope and per-purpose
   disclosure; no implicit family, provider, employer or NDIA access.

## Gate 3 — Accessibility / participant verification

**Automated tests added** for public route, authenticated wizard without submission,
session-only review/export, unauthorised access, focus, 320-pixel reflow, reduced motion,
and WCAG-tagged axe scans. Run only with the synthetic a11y database and explicitly enabled
pilot flag. These tests are not proof of overall WCAG 2.2 AA compliance.

**Human validation required**, with participant testers and explicit permission:

- Screen-reader operation (NVDA/JAWS and VoiceOver/TalkBack where applicable):
  headings, form group labels, focus changes, errors and consent announcements.
- Keyboard and switch access: logical order, focus visible, no keyboard trap,
  large targets, backwards navigation and accessible recovery after error.
- AAC-compatible input: slow composition, speech/text alternatives, no timed response,
  reliable input retention and accessible support-person handoff by permission.
- Zoom and high contrast: actual 200% and 400% text zoom, mobile reflow and no information loss.
- Reduced motion and cognitive accessibility: optional stages, plain language,
  fatigue breaks, review and right to withdraw.
- **Outstanding product gap:** session-only drafts are lost on reload, so interruption
  recovery **does not pass** until safe encrypted save/resume with clear opt-in is implemented.

Capture device, software version, disability-informed test task, observed result,
participant consent, evidence IDs, defect severity, owner and remediation/retest.

## Gate 4 — Synthetic preview and release control

1. Resolve Vercel account deployment restrictions with the actual account owner;
   current reported production deploy contexts are blocked.
2. Use a private **synthetic-data-only preview**, approved staging keys and separate database.
   Do not copy or sync real participant records into preview.
3. Record deployed Git SHA, Vercel project ID, environment flags, protected routes,
   authenticated synthetic accounts, CSP, HTTP headers and deployment logs.
4. Rerun protected-route checks, migration smoke, data-ownership and export checks.
5. Ensure feature flag is off by default in **all production environments**.
6. Human release owner verifies all gates, compliance and rollout/rollback plan, then
   explicitly authorises activation. No approval is inferred from merge or passing CI.

Rollback: disable `MAPABLE_ASSESSMENT_INTAKE_ENABLED` and revoke preview credentials
if staging data leaks; follow approved incident procedure for any privacy event.
Do not erase real participant records as a shortcut.

## Release decision

**NO-GO**. This record is an engineering plan with partial implementation, not a
security certification, NDIA system integration, completed instrument administration,
or proof of operational privacy compliance.

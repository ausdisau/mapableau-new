# Security gate status — Mission Portfolio Wave 0

**Inspected:** 2026-07-17  
**Purpose:** Track credential exposure and canonical-host remediation before Mission Portfolio product PRs.

## Credential exposure

| Location     | Status                                                          | Agent action                      | Human action still required                                                                                               |
| ------------ | --------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| PR #344 body | Scrubbed (credential text removed; compromised notice retained) | PR body rewritten without secrets | **Rotate** the exposed test-account password; invalidate sessions; confirm least privilege; search logs/history for reuse |
| PR #136 body | Scrubbed                                                        | Secret removed from description   | **Rotate** Uber client secret                                                                                             |
| PR #22 body  | Scrubbed                                                        | Key removed from description      | **Rotate** ORS API key                                                                                                    |

Do **not** re-publish credentials in PR bodies, docs, fixtures, screenshots, or commits.

## Canonical host and TLS

| Item                | Status                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| www TLS certificate | **Blocked on human / Vercel** — www reported expired; apex login works               |
| Host policy PR      | Draft #344 proposes apex-canonical (`https://mapable.com.au`)                        |
| Production env      | Human must set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the chosen canonical host |
| www → apex redirect | Only after www certificate is valid again                                            |

Until TLS/host is confirmed in production, treat auth/host remediation as **BLOCKED** for production claims.

## CI protections added

- `scripts/ci/secret-pattern-rules.ts` — shared patterns
- `scripts/ci/check-secret-patterns.ts` — scans source + docs for:
  - private keys / cloud tokens (existing)
  - password assignments
  - email + password pairs
  - URLs with embedded credentials
  - non-placeholder env secret values in application source
- `tests/ci/secret-patterns.test.ts` — synthetic fixtures only

## Gate verdict

| Check                     | Verdict                 |
| ------------------------- | ----------------------- |
| PR body scrub             | Done (agent)            |
| Credential rotation       | **BLOCKED — human**     |
| Session invalidation      | **BLOCKED — human**     |
| www cert / canonical host | **BLOCKED — human**     |
| CI secret patterns        | Done in this change set |

Mission Portfolio product implementation may proceed for **docs/contracts** once leadership-train depth allows. Production enablement and public claims remain blocked until human TLS + rotation confirmations land.

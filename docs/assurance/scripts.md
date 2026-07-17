# Scripts

All assurance scripts support `--dry-run` (DB-optional). Filter `--` from argv via `scripts/assurance/argv.ts`.

## Pack-expected wrappers

| Wrapper | Delegates to |
|---------|--------------|
| `scripts/backfill-assurance-controls.ts` | `scripts/assurance/backfill-frameworks.ts` |
| `scripts/backfill-security-evidence.ts` | `scripts/assurance/backfill-security-evidence.ts` |
| `scripts/backfill-ndia-readiness-bundles.ts` | `scripts/assurance/backfill-ndia-readiness-bundles.ts` |
| `scripts/audit-worker-trust-readiness.ts` | `scripts/assurance/audit-worker-trust.ts` |
| `scripts/audit-go-live-bypasses.ts` | `scripts/assurance/audit-go-live.ts` |
| `scripts/audit-evidence-freshness.ts` | `scripts/assurance/audit-evidence.ts` |

## pnpm shortcuts

- `pnpm assurance:evaluate`
- `pnpm assurance:audit-evidence`
- `pnpm assurance:backfill-controls -- --dry-run`

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.

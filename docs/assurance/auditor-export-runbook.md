# Auditor export runbook

Export an internal readiness bundle for external assurance review.

## Command

```bash
pnpm assurance:export-auditor-bundle
# Dry run:
pnpm exec tsx scripts/assurance/export-auditor-bundle.ts --dry-run
```

## Output

JSON file under `artifacts/assurance/auditor-bundle-<timestamp>.json` containing:

- Readiness projection
- Framework summary
- Exportable evidence (restricted excluded)
- Open findings

## Pre-export checklist

1. Run `assurance:audit-evidence` — no stale critical evidence
2. Run `assurance:test-controls` — no blocking test failures
3. Confirm `ASSURANCE_EVALUATION_ENABLED=true`
4. Human reviewer approves export scope

See also [auditor-export.md](./auditor-export.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Auditor bundles are for internal readiness review — not a certification package.

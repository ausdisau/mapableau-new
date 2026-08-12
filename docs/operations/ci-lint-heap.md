# CI lint memory remediation

**Status:** applied on branch `cursor/ci-lint-heap-remediation-a15c`  
**Related:** PR #473 CI / CareOS validate OOM (unrelated to Access Passport diff)

## Problem

GitHub-hosted runners have ~7GB RAM. A single `eslint` over `app components lib schemas scripts/ci` with `--max-old-space-size=8192` can OOM (exit 134) even when there are no rule violations. CareOS validation ran bare `pnpm eslint` with no heap cap and hit the same class of failure.

## Fix

1. **Shard** `pnpm lint` into `lint:app`, `lint:components`, `lint:lib`, `lint:schemas-ci` (4GB heap each).
2. Add **`pnpm lint:careos`** with a 4GB heap and wire `.github/workflows/careos-validation.yml` to it.
3. Cap the main CI job `NODE_OPTIONS` at **6144** so TypeScript/build do not request more heap than typical runners provide.

## Out of scope

- **Security / Security** — already remediated on `main` via `security/advisory-allowlist.json` (#475/#476 era).
- **Vercel** — account/permission blocked; cannot fix in-repo. Restore MapAble Vercel team access externally.

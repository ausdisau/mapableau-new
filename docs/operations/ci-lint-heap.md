# CI lint memory remediation

**Status:** applied on branch `cursor/ci-lint-heap-remediation-a15c` (follow-up after merged #477)  
**Related:** PR #473 / #477 / #484 — CI and CareOS validate OOM

## Problem

GitHub-hosted runners have ~7GB RAM. ESLint with `parserOptions.project`
pointing at the broad root `tsconfig.json` (and the TypeScript import resolver
using the same project) constructs a full TypeScript programme. That alone can
OOM (exit 134) even when path-sharded, and even when there are no rule
violations.

Evidence:

- PR #476 CI: unsharded `pnpm lint` reached ~8.1 GB and exited 134.
- PR #477 sharding-only: `lint:app` / `lint:careos` each reached ~4 GB and
  exited 134. **Sharding alone therefore does not solve the problem.**

## Root cause

The enabled config extends `plugin:@typescript-eslint/recommended` (not a
type-checked preset). No enabled rule requires typed parser services. The
`parserOptions.project` attachment was an unused multiplier on top of an
already-large include graph (`app`, `components`, `lib`, `packages`, `tests`,
Prisma, MCP, scripts, intelligence, and more).

## Fix

1. **Remove `parserOptions.project` permanently** from `.eslintrc.cjs`. Keep the
   TypeScript parser, current presets, jsx-a11y, `import/order`, and
   `--max-warnings 0`.
2. **Keep `import/no-unresolved` at error** by resolving tsconfig path aliases
   with `eslint-local-path-alias-resolver.cjs` (prefix/exact map only; unmatched
   imports fall through to the node resolver). Do not point
   `eslint-import-resolver-typescript` at `./tsconfig.json`.
3. **Shard** `pnpm lint` into `lint:app-api`, `lint:app-rest`, `lint:components`,
   `lint:lib`, `lint:schemas-ci` (4GB heap each, sequential).
4. Add **`pnpm lint:careos`** (4GB) and wire `.github/workflows/careos-validation.yml`
   to it.
5. Cap the main CI job `NODE_OPTIONS` at **6144** so TypeScript/build do not
   request more heap than typical runners provide.

Full-project type safety remains enforced by **`pnpm type-check`** (authoritative
TypeScript gate). ESLint is not a substitute for `tsc`.

## Out of scope / deferred

- **Typed ESLint (`recommended-type-checked` / `projectService`)** — not enabled
  here. If desired later, propose a separate measured change using a
  purpose-built ESLint-only TSConfig (narrow `include`), not the root
  `tsconfig.json`.
- **Security / Security** — remediated on `main` via
  `security/advisory-allowlist.json` (#475/#476).
- **Vercel** — account/permission blocked; restore MapAble Vercel team access
  externally.

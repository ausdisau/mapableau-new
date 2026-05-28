# Continuous integration (GitHub Actions)

MapAble uses **GitHub Actions** for quality gates and **Vercel** for deployment. They are intentionally separate: CI does not deploy; Vercel builds and hosts the app when you push or open a PR.

## Workflow

| File | Trigger | Jobs |
|------|---------|------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Push/PR to `main` or `master` | `pnpm install`, `prisma validate`, `pnpm lint`, `pnpm type-check`, `pnpm test` |

### Local parity

```bash
export HUSKY=0
export DATABASE_URL="postgresql://ci:ci@127.0.0.1:5432/ci?schema=public"
export DIRECT_URL="$DATABASE_URL"
export NEXTAUTH_SECRET="local-dev-only"
export NEXTAUTH_URL="http://localhost:3000"
export NDIS_ENCRYPTION_KEY="local-dev-only"

pnpm install --frozen-lockfile
pnpm exec prisma validate
pnpm lint
pnpm type-check
pnpm test
```

On Windows PowerShell, set the same variables with `$env:NAME = "value"`.

## Secrets and environment variables

### GitHub Actions (this CI workflow)

**No repository secrets are required** for the default CI job. It uses placeholder `DATABASE_URL` / `DIRECT_URL` values only so Prisma can validate the schema and generate the client.

Do **not** add production database URLs, Stripe keys, or Auth0 secrets to GitHub solely for this workflow.

### GitHub (optional, for other automation)

If you add deploy or integration workflows later, typical secrets:

| Secret | Used for |
|--------|----------|
| `VERCEL_TOKEN` | Vercel CLI deploy from Actions (only if you add a custom deploy job) |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Same |

Configure under **GitHub → Repository → Settings → Secrets and variables → Actions**.

### Vercel (deployment)

Vercel reads env vars from the project dashboard, not from this repo. Minimum for database-backed deploys:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL |
| `NEXTAUTH_SECRET` or `AUTH_SECRET` | Production session signing |
| `NEXTAUTH_URL` | Canonical site URL |

See [README_NEON.md](../README_NEON.md) and [`.env.example`](../.env.example) for the full list (Stripe, Auth0, integrations, etc.).

## Branch protection (recommended)

After CI is consistently green:

1. **GitHub → Settings → Branches → Branch protection** for `main`
2. Require status check **Lint, type-check, test** (job name from `ci.yml`)
3. Keep Vercel’s own deployment checks if you use preview deployments on PRs

## Known blockers (as of CI introduction)

These are **pre-existing** on the default branch and will fail CI until fixed:

1. **`pnpm type-check`** — Missing transport modules (`lib/transport/mobility-schema`, `handover-service`, etc.) and related UI/type errors. A stale local `.next/types` directory can add hundreds of extra errors referencing removed routes; delete `.next` before type-checking locally.
2. **`pnpm test`** — Failures in `tests/mobility-schema.test.ts` and `tests/transport-scheduling-routing.test.ts` (missing modules / assertion drift).
3. **`pnpm lint`** — Fails with **258 problems** (237 errors, 21 warnings); ~202 fixable via `pnpm lint:fix`. Examples: `tests/provider-cloud-context.test.ts` not included in `tsconfig` for `parserOptions.project`; widespread `import/order` issues (e.g. `tests/transport-scheduling-routing.test.ts`). Allow several minutes on a large tree locally.

Vercel may still build if Next.js defers some checks; CI is stricter and intended to surface these issues on every PR.

## What is not in CI

- **No `next build`** — avoids duplicating Vercel’s production build; add a separate workflow if you need build verification before merge.
- **No Docker** — app deploys as a Vercel serverless/Node project.
- **No GitLab CI** — remote is GitHub (`ausdisau/mapableau-new`).

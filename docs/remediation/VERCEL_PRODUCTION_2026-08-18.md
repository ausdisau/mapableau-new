# Vercel Production — `mapableau-new` (2026-08-18)

**Status:** Production tip deploys remain `FAILED` until a new `dpl_` is `READY`.  
**This note does not claim production readiness.**

Authoritative readiness rows stay in [PRODUCTION_READINESS_EVIDENCE_LEDGER.md](./PRODUCTION_READINESS_EVIDENCE_LEDGER.md).  
Related: [PR390_VERCEL_PREVIEW_MEMORY.md](./PR390_VERCEL_PREVIEW_MEMORY.md), [HEALTH_ENDPOINT_DIAGNOSIS.md](./HEALTH_ENDPOINT_DIAGNOSIS.md), [OWNER_ACTION_REQUIRED_OPS.md](./OWNER_ACTION_REQUIRED_OPS.md).

## Inspected tip

| Item                                   | Value                                                                  | Status                                      |
| -------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| `origin/main` at inspection            | `88a59d50926fe59f8873d24e8be2acb0e2bf3fd1`                             | `VERIFIED` (repository)                     |
| GitHub CI / Accessibility / type-check | Green on that SHA                                                      | `VERIFIED` (disposable_ci)                  |
| Vercel project                         | `mapableau-new` (`prj_iAhQk0b6IhigXw58PFiYfiHSATmW`), team `mapableau` | `VERIFIED` (GitHub deployment URLs)         |
| Latest Production attempts             | `dpl_5n1c8siPdMpGRLa6ur4ZTGDb235g`, `dpl_FTUnv4g98KpXGJq1LL8nNRGhyNTB` | `FAILED`                                    |
| Last Production **success**            | 2026-07-29, SHA `3e665317dad6226c338ee4de2bbe5f4d1b8779e1`             | `VERIFIED` (GitHub deployment `5654705646`) |
| Failures since                         | Every Production web deploy from 2026-08-11 (`#470` onward)            | `FAILED`                                    |
| Live apex `GET /api/health/live`       | `{"status":"ok"}` — stale last-good deploy, not the failed tip         | Public edge `VERIFIED`; tip `FAILED`        |
| Realtime project                       | Succeeds on a different Vercel team                                    | `NOT_APPLICABLE` to this project            |

Inspectors (login-gated):

- https://vercel.com/mapableau/mapableau-new/5n1c8siPdMpGRLa6ur4ZTGDb235g
- https://vercel.com/mapableau/mapableau-new/FTUnv4g98KpXGJq1LL8nNRGhyNTB

## Why CI green does not prove Production

| Surface           | Heap                   | In-build eslint | In-build tsc              | Env gate                                      |
| ----------------- | ---------------------- | --------------- | ------------------------- | --------------------------------------------- |
| GitHub CI         | 6144–8192              | skipped         | skipped                   | off                                           |
| Vercel Preview    | 6144 after this change | skipped         | skipped after this change | off                                           |
| Vercel Production | 6144 after this change | skipped         | skipped after this change | **on** (`VERCEL=1` + `VERCEL_ENV=production`) |

`assertDeployedProductionEnv` is unchanged and still fail-closed. Secret values are never printed.

Two failure modes, distinguishable only from build logs:

1. **Seconds:** `MapAble production environment validation failed (fail-closed)` → owner Production env.
2. **Minutes / SIGKILL / JS heap OOM** during types or SSG → builder memory. This change skips duplicate in-build `tsc` on Vercel (CI remains the type gate) and restores heap **5120 → 6144**. Do **not** raise to 7168 on the default 8 GB machine.

No commit between `3e665317` and `88a59d50` changed `next.config.ts`, `scripts/run-next-build.mjs`, or `lib/env/assert-deployed-production-env.ts`. The first post-gap failure coincides with `#470` (Access ontology graph growth).

## Vercel MCP from this agent

Cursor Vercel MCP listed team `mapableau` (`team_AW0NvBx9JTuMfbAfbLqI2p32`) but `list_projects` was empty and `get_project` / `get_deployment` / build logs for `prj_iAhQk0b6IhigXw58PFiYfiHSATmW` and the `dpl_` IDs above returned **404**. Root-cause text is therefore still unproven from this session.

**Owner:** reconnect Cursor Vercel MCP to team `mapableau` **and** project `mapableau-new` so agents can read logs.

## Owner checklist (do not paste secrets)

1. Vercel → `mapableau-new` → Settings → Environment Variables → **Production**:
   - `NEXTAUTH_URL` = `https://mapable.com.au`
   - `NEXT_PUBLIC_APP_URL` = `https://mapable.com.au`
   - `DATABASE_URL` / `DIRECT_URL` (Neon production, not localhost)
   - `NEXTAUTH_SECRET` (≥16 characters)
2. Redeploy the reviewed SHA (or merge this PR and let Production rebuild).
3. Record: deployment ID, commit SHA, build result (`READY` / `ERROR`), first log error line (redact secrets).
4. Probe (expect JSON, not HTML 404):

```bash
curl -sS https://mapable.com.au/api/health/live
curl -sS https://mapable.com.au/api/health/ready
pnpm audit:https-gate
```

5. If the log is the env-gate error, this code change is complete; remaining work is owner env.
6. If the log is SIGKILL / heap OOM after this change, upgrade the Vercel build machine. Do not set heap to 7168 on the default builder.
7. `www.mapable.com.au` TLS renewal remains `OWNER_ACTION_REQUIRED` (separate from this build).

Draft PR #488 proposed the same memory half. This change supersedes it; do not merge both.

## Repository change in this PR

- Skip duplicate `tsc` inside `next build` when `VERCEL=1` (same as GHA).
- Restore Vercel heap to 6144 MB now that in-build eslint+tsc are skipped.
- Keep `assertDeployedProductionEnv` fail-closed.
- Do **not** mark a new Production deployment `VERIFIED` until a post-change `dpl_` is `READY`.

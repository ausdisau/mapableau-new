# MapAble production infrastructure runbook

This runbook captures the production baseline for the current MapAble web app.
It is Vercel-first, with documented fallback hosts if Vercel billing or domain
access blocks deployment.

## Current hosting status

- Primary target: Vercel.
- Canonical public host: `https://www.mapable.com.au`.
- Apex host: `https://mapable.com.au` should redirect or canonicalise to
  `https://www.mapable.com.au`.
- Known blocker: Vercel CLI access for the current agent account cannot deploy
  because the `ausdisau` team is suspended for billing, and the CLI account does
  not have access to `mapable.com.au`/`www.mapable.com.au`.

Do not treat a successful local build as production deployment proof until the
Vercel billing/domain blocker is cleared and a production deployment URL is
verified.

## Required production environment variables

| Variable                                               | Required                      | Notes                                                                                                                                         |
| ------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                         | Yes                           | Pooled Neon/Postgres URL for runtime Prisma queries.                                                                                          |
| `DIRECT_URL`                                           | Yes                           | Direct Neon/Postgres URL for migrations. Do not use the pooler host.                                                                          |
| `NEXTAUTH_SECRET`                                      | Yes                           | Stable private value, at least 16 characters. The code has a fallback only to keep auth endpoints from returning 500 during misconfiguration. |
| `NEXTAUTH_URL`                                         | Yes                           | `https://www.mapable.com.au` in production.                                                                                                   |
| `NEXT_PUBLIC_APP_URL`                                  | Yes                           | `https://www.mapable.com.au` for canonical links and client-safe app URL.                                                                     |
| `NDIS_ENCRYPTION_KEY`                                  | Recommended                   | Separate stable secret for encrypted NDIS identifiers.                                                                                        |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL`             | If email enabled              | Required for production email delivery.                                                                                                       |
| `DOCUMENT_STORAGE_MODE`                                | Yes                           | Use a production-safe mode once document upload workflows are live.                                                                           |
| `AI_GATEWAY_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` | If search interpreter enabled | Required for natural-language provider search.                                                                                                |
| `POSTHOG_API_KEY` / `POSTHOG_HOST`                     | If analytics enabled          | Required for LLM analytics capture.                                                                                                           |

## Deployment sequence

1. Confirm the Vercel team subscription is active.
2. Confirm the Vercel project that owns `mapable.com.au` is accessible.
3. Confirm domain assignment:

   ```bash
   vercel domains inspect mapable.com.au --scope <team>
   vercel domains inspect www.mapable.com.au --scope <team>
   ```

4. Confirm project link or link explicitly:

   ```bash
   test -f .vercel/project.json && echo "Linked" || vercel link
   ```

5. Configure production env vars in Vercel.
6. Run local verification:

   ```bash
   pnpm setup:cloud-agent
   pnpm type-check
   pnpm build
   ```

7. Deploy:

   ```bash
   vercel deploy --prod --yes --scope <team>
   ```

8. Smoke-check production:

   ```bash
   curl -I https://www.mapable.com.au/
   curl https://www.mapable.com.au/api/auth/session
   curl https://www.mapable.com.au/api/auth/providers
   curl -I https://www.mapable.com.au/robots.txt
   curl -I https://www.mapable.com.au/sitemap.xml
   ```

## Database and migrations

- Runtime app uses `DATABASE_URL`.
- Migration commands use `DIRECT_URL`.
- Production migrations must be reviewed before deploy:

  ```bash
  DIRECT_URL="postgresql://..." pnpm exec prisma migrate deploy
  ```

- Do not run `prisma db push` against production.
- Do not reset production branches without a verified backup.

## Rollback

Vercel rollback should be done by promoting the last known-good deployment in
the Vercel dashboard or CLI. If a schema migration caused the issue, treat
rollback as a data migration incident and verify whether the schema can safely
roll backward before promoting older code.

## Ownership checklist

- Production Vercel project owner confirmed.
- Billing active.
- Domain access confirmed.
- Production env vars set.
- Neon branch and backup owner confirmed.
- Auth smoke checks pass.
- SEO routes return 200.
- Monitoring owner confirmed.

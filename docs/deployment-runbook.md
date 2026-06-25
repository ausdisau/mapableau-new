# MapAble deployment runbook

## Prerequisites

- Vercel project linked to GitHub
- Production domains: `mapable.com.au`, `www.mapable.com.au` (canonical: `www`)
- Neon PostgreSQL with pooled `DATABASE_URL` and direct `DIRECT_URL`

## Environment variables

See `docs/integrations/environment.md` and `.env.example`. Minimum production set:

- `DATABASE_URL`, `DIRECT_URL`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` (contact + interest forms)
- `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` (only if approved)

Validate optional integrations:

```bash
pnpm check:integrations-env
```

## Build and test (pre-deploy)

```bash
pnpm setup:cloud-agent
pnpm type-check
pnpm lint
pnpm test
pnpm test:a11y
pnpm build
```

**Note:** ESLint is ignored during `next build` — do not skip `pnpm lint` in CI.

## Deploy (Vercel)

1. Merge to `main` or promote a preview deployment.
2. Run migrations against production:

```bash
pnpm exec prisma migrate deploy
```

3. Smoke check:

```bash
curl -I https://www.mapable.com.au/
curl https://www.mapable.com.au/api/health
curl https://www.mapable.com.au/api/auth/session
```

## Rollback

### Vercel instant rollback

1. Open Vercel → Project → Deployments.
2. Find the last known-good production deployment.
3. Click **⋯** → **Promote to Production**.

### Database rollback

- Do **not** run destructive migrations without backup approval.
- Restore Neon branch/backup per `docs/operations/neon.md`.
- If a migration partially applied, use `prisma migrate resolve` after DBA review.

### Feature flags

- Disable risky modules via env flags (orchestration, smart contracts, analytics) without code rollback when possible.

## Launch checklist

- [ ] Accessibility smoke: `pnpm test:a11y`
- [ ] Form submission test on `/contact` and `/early-access`
- [ ] SEO: `/robots.txt`, `/sitemap.xml`, canonical URLs
- [ ] Analytics consent behaviour verified
- [ ] Privacy copy on forms and `/privacy`
- [ ] Mobile responsiveness spot check
- [ ] Keyboard navigation to main CTAs on `/` and `/access`

## Health check

`GET /api/health` returns `{ status: "ok" }` — suitable for uptime monitors.

## Related docs

- `docs/operations/production-preflight.md`
- `docs/cursor-site-audit.md`
- `docs/security-privacy-notes.md`

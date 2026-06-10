# Production preflight checklist

Run this checklist before promoting MapAble to a public production deployment.

## Build readiness

- [ ] `pnpm setup:cloud-agent`
- [ ] `pnpm type-check`
- [ ] `pnpm build`
- [ ] Focused tests for touched areas pass.
- [ ] No unresolved merge conflicts.

## Hosting

- [ ] Vercel billing active, or fallback host selected.
- [ ] Project linked to the correct GitHub repository.
- [ ] `mapable.com.au` and `www.mapable.com.au` assigned to the production project.
- [ ] `www.mapable.com.au` is the canonical host.
- [ ] Preview deployment policy understood.

## Auth

- [ ] `NEXTAUTH_SECRET` is stable, private, and at least 16 characters.
- [ ] `NEXTAUTH_URL=https://www.mapable.com.au`.
- [ ] `NEXT_PUBLIC_APP_URL=https://www.mapable.com.au`.
- [ ] `/api/auth/session` returns 200.
- [ ] `/api/auth/providers` returns 200.
- [ ] `/login` and `/register` render without client fetch errors.
- [ ] OAuth callback URLs are configured for every enabled provider.

## Database

- [ ] `DATABASE_URL` is a pooled runtime URL.
- [ ] `DIRECT_URL` is a direct migration URL.
- [ ] Production branch/backups are owned.
- [ ] `prisma migrate deploy` plan reviewed.
- [ ] No destructive migration runs without backup approval.

## Storage and documents

- [ ] Document storage mode is production-safe before document uploads are enabled.
- [ ] Sensitive documents are not stored in identity-provider metadata.
- [ ] Data access logging is enabled for sensitive reads where implemented.

## Email and messaging

- [ ] SendGrid or email provider configured if password reset/email flows are enabled.
- [ ] Twilio Verify credentials configured if `TWILIO_2FA_ENABLED=true`.
- [ ] Marketing messaging remains disabled until opt-in, sender compliance and unsubscribe flows are confirmed.

## Analytics and AI

- [ ] Product analytics env vars are configured only if analytics are approved.
- [ ] LLM analytics env vars are configured only if LLM tracing is approved.
- [ ] No API keys are hardcoded.
- [ ] User identifiers in analytics are minimal and privacy-reviewed.

## SEO/AEO

- [ ] `/robots.txt` returns 200.
- [ ] `/sitemap.xml` returns 200.
- [ ] Canonical URL points to `https://www.mapable.com.au`.
- [ ] Public claims avoid unsupported NDIS registration, WCAG conformance and data sovereignty statements.

## Post-deploy smoke checks

```bash
curl -I https://www.mapable.com.au/
curl https://www.mapable.com.au/api/auth/session
curl https://www.mapable.com.au/api/auth/providers
curl -I https://www.mapable.com.au/robots.txt
curl -I https://www.mapable.com.au/sitemap.xml
```

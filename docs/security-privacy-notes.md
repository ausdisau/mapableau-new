# Security and privacy notes (MapAble)

Last reviewed: June 2026. Complements `docs/modules/privacy-and-audit.md`.

## Data we collect on public forms

| Form | Fields | Storage / handling |
| --- | --- | --- |
| Contact | name, email, topic, message | Email via SendGrid; not logged in production |
| Interest | name, email, phone, role, location, optional access needs | Email only; access needs **not** written to server logs |

## Logging rules

- Do **not** log: access needs, disability details, NDIS numbers, free-text health info, full addresses, or phone numbers in application logs.
- Contact/interest API routes log only generic failure messages.
- Analytics uses `sanitizeAnalyticsProperties()` — sensitive keys stripped before dispatch.

## Server-side validation

- All public forms validated with Zod before email dispatch.
- IP rate limiting on `/api/contact` and `/api/interest` (5 requests / minute / IP).

## Client bundle exposure

- Only `NEXT_PUBLIC_*` variables are exposed to the browser.
- API keys (SendGrid, PostHog, NDIS encryption) must remain server-side.

## Security headers

Configured in `next.config.ts` for all routes:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Analytics consent

- `trackProductEvent` requires `setConsentState(true)` before production analytics fire.
- Development mode logs sanitised events to console.

## Residual risks

| Risk | Mitigation |
| --- | --- |
| ESLint not blocking builds | Run `pnpm lint` in CI |
| Access report photos on local FS | Move to object storage before scale |
| NDIS rule engine outputs | Human review; not legal advice |
| LLM analytics paths | Audit prompts for PII leakage |
| Email provider outage | 503 response with support email fallback |

## Infrastructure rate limiting

Application-level IP limits exist for forms. Add Vercel WAF or edge rate limits for broader DDoS protection at infrastructure level if needed.

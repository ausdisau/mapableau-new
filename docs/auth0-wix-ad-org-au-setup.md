# Auth0, Wix, and ad.org.au identity bridge

This document describes how MapAble connects the public Wix website, the secure MapAble app, and Australian Disability Ltd identity services through Auth0.

## Domain architecture

| Domain | Purpose |
| --- | --- |
| `www.mapable.com.au` | Wix public website |
| `mapable.com.au` | Wix public website |
| `app.mapable.com.au` | Secure MapAble app / portal |
| `login.ad.org.au` | Auth0 custom login domain (Australian Disability Ltd) |
| `admin.ad.org.au` | Optional future internal/admin tools |

## Authentication flow

```text
Wix public site
  → MapAble login route (/auth/login)
  → Auth0 Universal Login at login.ad.org.au
  → MapAble callback (/auth/callback)
  → MapAble profile create/link
  → Role onboarding or role dashboard
```

**Important principles**

- Wix is the public front door only.
- Auth0 confirms identity only — not provider/worker/driver/admin eligibility.
- MapAble remains the source of truth for roles, permissions, consent, verification, and participant data.
- Do not store sensitive MapAble data in Wix Members.

## DNS: login.ad.org.au

1. In the Auth0 Dashboard, open **Branding → Custom Domains**.
2. Add `login.ad.org.au` as a custom domain.
3. Auth0 provides a CNAME target — use the value shown in your tenant.
4. Create a DNS CNAME record:

```text
login.ad.org.au  CNAME  <Auth0-provided-target>
```

5. Wait for Auth0 to verify the domain and issue TLS certificates.

## Auth0 application settings

Application type: **Regular Web Application**

### Allowed Callback URLs

```text
https://app.mapable.com.au/auth/callback
http://localhost:3000/auth/callback
```

### Allowed Logout URLs

```text
https://www.mapable.com.au
https://app.mapable.com.au
http://localhost:3000
```

### Allowed Web Origins

```text
https://app.mapable.com.au
http://localhost:3000
```

### Recommended scopes

```text
openid profile email
```

Optional API audience: set `AUTH0_AUDIENCE` if calling a protected Auth0 API.

## Wix login button URLs

Do **not** build Auth0 `/authorize` URLs in Wix. Link to MapAble so state, nonce, callback, and `returnTo` handling stay server-side.

| Wix button | URL |
| --- | --- |
| Login | `https://app.mapable.com.au/auth/login?returnTo=/dashboard` |
| Get started | `https://app.mapable.com.au/register` |

Local development:

```text
http://localhost:3000/auth/login?returnTo=/dashboard
http://localhost:3000/register
```

## Environment variables

### Production

```env
AUTH0_DOMAIN=login.ad.org.au
AUTH0_SECRET=<32+ byte hex secret>
AUTH0_BASE_URL=https://app.mapable.com.au
AUTH0_ISSUER_BASE_URL=https://login.ad.org.au
AUTH0_CLIENT_ID=<from Auth0 dashboard>
AUTH0_CLIENT_SECRET=<from Auth0 dashboard>
AUTH0_SCOPE=openid profile email
AUTH0_AUDIENCE=<optional>
APP_BASE_URL=https://app.mapable.com.au
ENABLE_WIX_MEMBER_BRIDGE=false
```

### Local development

```env
AUTH0_DOMAIN=login.ad.org.au
AUTH0_SECRET=<openssl rand -hex 32>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://login.ad.org.au
AUTH0_CLIENT_ID=<from Auth0 dashboard>
AUTH0_CLIENT_SECRET=<from Auth0 dashboard>
AUTH0_SCOPE=openid profile email
APP_BASE_URL=http://localhost:3000
AUTH_ENABLE_LEGACY_CREDENTIALS=true
ENABLE_WIX_MEMBER_BRIDGE=false
```

Generate `AUTH0_SECRET`:

```bash
openssl rand -hex 32
```

Optional Wix bridge (disabled by default):

```env
ENABLE_WIX_MEMBER_BRIDGE=false
WIX_API_KEY=
WIX_SITE_ID=
WIX_ACCOUNT_ID=
```

When `ENABLE_WIX_MEMBER_BRIDGE=true`, `WIX_API_KEY` and `WIX_SITE_ID` are required.

## MapAble auth routes

Handled by `@auth0/nextjs-auth0` middleware:

| Route | Purpose |
| --- | --- |
| `GET /auth/login` | Starts Auth0 Authorization Code flow |
| `GET /auth/callback` | Verifies Auth0 session and runs MapAble bridge |
| `GET /auth/logout` | Clears Auth0/MapAble session |
| `GET /auth/me` | Returns authenticated MapAble profile and role state |

Bridge API routes:

- `POST /api/auth/link-identity`
- `POST /api/auth/unlink-identity`
- `GET /api/auth/linked-identities`
- `GET /api/auth/onboarding-status`
- `POST /api/auth/onboarding-role`
- `POST /api/wix/auth0-bridge` (disabled unless feature flag enabled)

## Local development notes

1. Copy Auth0 variables into `.env.local`.
2. Register `http://localhost:3000/auth/callback` in Auth0.
3. Run `pnpm dev` and open `/login` or `/auth/login?returnTo=/dashboard`.
4. Legacy credential login remains available when `AUTH_ENABLE_LEGACY_CREDENTIALS=true` for seeded dev users.
5. Run migrations: `npx prisma migrate deploy`.

## Security warnings

- Never expose `AUTH0_CLIENT_SECRET` or `AUTH0_SECRET` to the browser.
- Auth0 tokens are stored in HttpOnly cookies via the SDK — not `localStorage`.
- `returnTo` values are validated server-side; external URLs are rejected and audited.
- Email matches alone do not auto-link accounts when policy requires confirmation.
- Provider, worker, driver, and admin roles are never granted from Auth0 email alone.
- Wix member sync (when enabled) must never include NDIS, clinical, billing, or safeguarding data.
- Sensitive actions (documents, payouts, role changes, exports) require future step-up auth.

## Database tables

- `auth_identity_links` — Auth0 subject to MapAble profile mapping
- `auth_bridge_events` — auditable auth/linking events
- `profile_onboarding_status` — onboarding progress and selected role
- `wix_member_links` — optional non-sensitive Wix member bridge

## Audit events

Logged to `auth_bridge_events`:

- `login_success`, `login_failed`, `logout`
- `auth0_callback_received`
- `profile_created`, `identity_linked`, `identity_unlinked`
- `unsafe_return_to_rejected`, `account_linking_required`, `suspicious_login`

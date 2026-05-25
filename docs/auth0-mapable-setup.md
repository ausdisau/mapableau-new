# Auth0 setup for MapAble

MapAble uses Auth0 Universal Login with Google as an identity provider only. Auth0 authenticates identity; MapAble controls roles, consent, and access to sensitive data.

## Tenant configuration

1. **Custom domain**: Bind `login.ad.org.au` in Auth0 Dashboard → Branding → Custom Domains. Complete DNS verification before production.

2. **Application** (Regular Web Application):
   - Grant types: Authorization Code, Refresh Token (enable rotation where available)
   - PKCE: Required for public clients; enabled for SPA/native if used
   - Token Endpoint Authentication: Post (confidential client)

3. **Allowed Callback URLs**
   ```
   https://app.mapable.com.au/auth/callback
   http://localhost:3000/auth/callback
   ```

4. **Allowed Logout URLs**
   ```
   https://www.mapable.com.au
   https://app.mapable.com.au
   http://localhost:3000
   ```

5. **Allowed Web Origins**
   ```
   https://app.mapable.com.au
   http://localhost:3000
   ```

## Google social connection

- Enable Google connection on the Auth0 application
- Scopes: `openid`, `email`, `profile` only
- Do **not** request: Drive, Gmail, Calendar, Contacts, or health-related scopes
- MapAble stores only: Auth0 user id, Google subject (if present), email, email_verified, display name, optional avatar URL

## Security

- Enable Attack Protection (brute force, suspicious IP) per tenant tier
- Enable Breached Password Detection if available
- Configure MFA for privileged access in Auth0; MapAble also enforces server-side step-up for sensitive actions
- Do **not** store NDIS, disability, clinical, invoice, incident, or support data in Auth0 `app_metadata` or `user_metadata`

## Environment variables

See `.env.example`. MapAble resolves both legacy names and SDK v4 names:

| Variable | Purpose |
|----------|---------|
| `AUTH0_SECRET` | Session cookie encryption (32+ chars) |
| `AUTH0_BASE_URL` / `APP_BASE_URL` | App origin, e.g. `https://app.mapable.com.au` |
| `AUTH0_ISSUER_BASE_URL` / `AUTH0_DOMAIN` | Custom domain host only: `login.ad.org.au` |
| `AUTH0_CLIENT_ID` | Application client ID |
| `AUTH0_CLIENT_SECRET` | Application client secret |
| `AUTH0_AUDIENCE` | Optional API audience |
| `AUTH0_SCOPE` | Default `openid profile email` |
| `AUTH_PROVIDER` | `auth0` (default) or `nextauth` for legacy |

Generate secret: `openssl rand -hex 32`

## HIPAA and compliance

MapAble implements HIPAA-ready architecture controls in application code. **Do not claim HIPAA compliance** until vendor BAAs are signed, risk analysis is complete, and legal/compliance review is done.

## Domains

| Domain | Role |
|--------|------|
| www.mapable.com.au | Public marketing site |
| app.mapable.com.au | Secure MapAble application |
| login.ad.org.au | Auth0 custom login domain |
| admin.ad.org.au | Optional admin tools (future) |

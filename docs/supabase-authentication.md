# Supabase authentication

MapAble uses [Supabase Auth](https://supabase.com/docs/guides/auth) for OIDC/JWT sessions. The Next.js app stores Supabase refresh/access tokens in HTTP-only cookies via `@supabase/ssr`, and resolves each Supabase user to a MapAble `User` row in Postgres (Prisma).

Production host: **https://mapable.com.au** (also **https://www.mapable.com.au** on Vercel).

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://louioyirfyzdjshmremy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_SECRET=change-me-in-production
NEXT_PUBLIC_APP_URL=https://mapable.com.au
```

Local dev: set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`.

- **Anon key** — browser and server route handlers (never expose the service role key to the client).
- **Service role key** — registration bootstrap, Wix/Keycloak bridge session minting, admin auth operations only.
- **APP_SECRET** — signs short-lived Wix bridge tokens (`NEXTAUTH_SECRET` still works as a legacy alias).

## Supabase dashboard (Authentication → URL configuration)

| Setting | Value |
|--------|--------|
| Site URL | `https://mapable.com.au` |
| Redirect URLs | `https://mapable.com.au/auth/callback` |
| | `https://www.mapable.com.au/auth/callback` |
| | `http://localhost:3000/auth/callback` (local dev) |

## Flows

### Email / password

1. **Register** — `POST /api/register` creates the Prisma user, bootstraps roles, then creates the linked Supabase user (`authSupabaseId`).
2. **Login** — client calls `supabase.auth.signInWithPassword`; middleware refreshes the JWT cookie on each request.

### OAuth (Google and others)

1. Client calls `supabase.auth.signInWithOAuth`.
2. Supabase redirects to `/auth/callback`, which runs `exchangeCodeForSession`.
3. On first login, `getCurrentUser()` links by email and stores `authSupabaseId`.

Configure providers in the Supabase dashboard (**Authentication → Providers**). OAuth uses the current browser origin for the callback (`mapable.com.au` in production, `localhost:3000` locally).

For Auth0 or other OIDC IdPs, add them as custom providers in Supabase rather than in-app NextAuth.

### External bridges (Wix)

Wix still links identities in `IdentityProviderLink`. After a successful link, `/api/auth/wix/complete` mints a Supabase session with the admin `generateLink` + `verifyOtp` pattern (see `lib/auth/auth-bridge-session.ts`).

Production Wix redirect URI: `https://mapable.com.au/login/wix/callback` (derived from `NEXT_PUBLIC_APP_URL` when `WIX_REDIRECT_URI` is unset).

## Server API

- `getCurrentUser()` — Supabase JWT → Prisma `User` (via `lib/auth/current-user.ts`).
- `requireApiSession()` — same, for route handlers.
- `GET /api/auth/me` — current app user JSON for client components.
- `POST /api/auth/logout` — clears Supabase session cookies.

## Database

`User.authSupabaseId` is a unique optional link to `auth.users.id`. `passwordHash` is optional for users who only authenticate through Supabase/OAuth.

## Client helpers

Supabase dashboard helpers live under `utils/supabase/` (`client.ts`, `server.ts`, `middleware.ts`). App code may import those directly or use the wrappers in `lib/supabase/`.

App URL helpers: `lib/app-url.ts` (`getAppBaseUrl`, `getAuthCallbackUrl`, Wix URIs).

## Local development

1. Create a Supabase project (or use the shared MapAble project).
2. Copy URL, anon key, and service role key into `.env.local`.
3. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
4. Run migrations: `npx prisma migrate deploy`
5. Enable Email provider (and Google/OAuth if needed) in Supabase Auth settings.

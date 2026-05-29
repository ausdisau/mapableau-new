# Supabase authentication

MapAble uses [Supabase Auth](https://supabase.com/docs/guides/auth) for OIDC/JWT sessions. The Next.js app stores Supabase refresh/access tokens in HTTP-only cookies via `@supabase/ssr`, and resolves each Supabase user to a MapAble `User` row in Postgres (Prisma).

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_SECRET=change-me-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- **Anon key** — browser and server route handlers (never expose the service role key to the client).
- **Service role key** — registration bootstrap, Wix/Keycloak bridge session minting, admin auth operations only.
- **APP_SECRET** — signs short-lived Wix bridge tokens (`NEXTAUTH_SECRET` still works as a legacy alias).

## Flows

### Email / password

1. **Register** — `POST /api/register` creates the Prisma user, bootstraps roles, then creates the linked Supabase user (`authSupabaseId`).
2. **Login** — client calls `supabase.auth.signInWithPassword`; middleware refreshes the JWT cookie on each request.

### OAuth (Google and others)

1. Client calls `supabase.auth.signInWithOAuth`.
2. Supabase redirects to `/auth/callback`, which runs `exchangeCodeForSession`.
3. On first login, `getCurrentUser()` links by email and stores `authSupabaseId`.

Configure providers in the Supabase dashboard (**Authentication → Providers**). Add redirect URL:

`http://localhost:3000/auth/callback` (and production URL).

For Auth0 or other OIDC IdPs, add them as custom providers in Supabase rather than in-app NextAuth.

### External bridges (Wix)

Wix still links identities in `IdentityProviderLink`. After a successful link, `/api/auth/wix/complete` mints a Supabase session with the admin `generateLink` + `verifyOtp` pattern (see `lib/auth/auth-bridge-session.ts`).

## Server API

- `getCurrentUser()` — Supabase JWT → Prisma `User` (via `lib/auth/current-user.ts`).
- `requireApiSession()` — same, for route handlers.
- `GET /api/auth/me` — current app user JSON for client components.
- `POST /api/auth/logout` — clears Supabase session cookies.

## Database

`User.authSupabaseId` is a unique optional link to `auth.users.id`. `passwordHash` is optional for users who only authenticate through Supabase/OAuth.

## Local development

1. Create a Supabase project.
2. Copy URL, anon key, and service role key into `.env`.
3. Run migrations: `npx prisma migrate deploy`
4. Enable Email provider (and Google/OAuth if needed) in Supabase Auth settings.

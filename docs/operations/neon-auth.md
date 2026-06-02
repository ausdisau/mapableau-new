# Neon Auth (MapAble)

MapAble can use **Neon Auth** (managed Better Auth on your Neon `production` branch) instead of self-hosted NextAuth. Auth users live in the `neon_auth` schema; the app still maps sessions to the Prisma `User` row for roles, care, and billing.

## Production Neon project

| Item | Value |
|------|--------|
| Neon project | `mapableau` (`cold-paper-45965334`) |
| Branch | `production` |
| Auth base URL | `https://ep-old-wildflower-a72yuev6.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth` |

Trusted origins configured for:

- `https://mapable.com.au`
- `https://www.mapable.com.au`
- `https://*.mapableau.vercel.app`
- Localhost (via `allow_localhost`)

## Enable in the app

Set in `.env` / Vercel **Production** (and Preview if you want Neon there too):

| Variable | Purpose |
|----------|---------|
| `NEON_AUTH_BASE_URL` | Auth API base (from Neon Console → Auth → Configuration) |
| `NEON_AUTH_COOKIE_SECRET` | Session cookie signing secret, **≥ 32 characters** (`openssl rand -base64 32`) |
| `AUTH_PROVIDER` | Optional: `neon` (force) or `nextauth` (force legacy). If unset, Neon is used when both Neon vars above are set. |

Keep existing database vars:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled Postgres (app runtime) |
| `DIRECT_URL` | Direct Postgres (Prisma migrate) |

Local setup:

```bash
python3 scripts/configure-neon-auth-env.py \
  'https://ep-old-wildflower-a72yuev6.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth'

# Add to .env (do not commit):
# NEON_AUTH_COOKIE_SECRET="<output of: openssl rand -base64 32>"
```

Sync to Vercel production:

```bash
pnpm exec tsx scripts/sync-vercel-production-env.ts
```

Redeploy after changing auth env vars.

## Vercel + Neon integration (recommended)

In the [Neon Vercel integration](https://vercel.com/marketplace/neon), enable **Auth** when connecting the project. Vercel then injects `NEON_AUTH_BASE_URL` (and preview URLs as trusted origins) per deployment. See [Neon docs: Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration).

## Behaviour

- API route: `app/api/auth/[...path]/route.ts` — Neon handler when enabled, otherwise NextAuth.
- Sessions: `getCurrentUser()` reads Neon session, then `ensureAppUserFromNeonSession()` links/creates the Prisma `User` by email.
- Login / register UI uses `@neondatabase/auth` client (`signIn.email`, `signUp.email`, Google via `signIn.social`).
- Middleware uses Neon Auth route protection on the same paths as before (`/dashboard`, `/care`, etc.).

## Existing users (NextAuth → Neon)

- **Email/password:** Users must sign in with the same email on Neon Auth. If they only had a Prisma `passwordHash`, use **Forgot password** once Neon Auth is live (Neon sends the reset email) or register again with the same email if sign-up is allowed.
- **Prisma `User` rows:** Unchanged. `getCurrentUser()` still links Neon sessions to Prisma via `ensureAppUserFromNeonSession()` (same path as OAuth today).
- **OAuth:** In Neon mode, Google uses Neon’s shared OAuth (`signIn.social`). Microsoft/Facebook stay on NextAuth until you configure them in Neon or keep `AUTH_PROVIDER=nextauth`.

## Roll back to NextAuth

Set `AUTH_PROVIDER=nextauth` on Vercel and redeploy. NextAuth remains in the codebase; OAuth env vars (`GOOGLE_CLIENT_ID`, etc.) apply only in NextAuth mode.

## References

- [Neon Auth overview](https://neon.com/docs/auth/overview)
- [Next.js quickstart](https://neon.com/docs/auth/quick-start/nextjs)
- [Choosing NextAuth vs Neon Auth](https://neon.com/guides/nextauth-neon-auth-better-auth-postgres)

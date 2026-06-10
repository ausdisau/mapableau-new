# NextAuth secret policy (finding #1) — option C implemented

## Policy

MapAble uses a **hybrid** auth secret policy:

| Environment | Behavior |
| --- | --- |
| **Vercel production** (`VERCEL_ENV=production`) | Fail closed. `NEXTAUTH_SECRET` (min 16 chars) is required. No repo fallback. |
| **Vercel preview** (`VERCEL_ENV=preview`) | Fail closed unless a **platform-injected** preview secret is set: `NEXTAUTH_SECRET` or `MAPABLE_PREVIEW_AUTH_SECRET` in the Vercel **Preview** env group. |
| **Local development / tests** | Dev-only fallback so `/api/auth/*` stays usable without Vercel env. Not used on deployed builds. |
| **Other production hosts** | Fail closed unless `NEXTAUTH_SECRET` is configured. |

## Vercel setup

1. **Production** — set `NEXTAUTH_SECRET` (32+ random bytes) in the Production environment.
2. **Preview** — set either:
   - `NEXTAUTH_SECRET` scoped to Preview, or
   - `MAPABLE_PREVIEW_AUTH_SECRET` scoped to Preview (dedicated preview signing key)

Never commit preview/production secrets to the repository.

## Runtime behavior when misconfigured

- `resolveNextAuthSecret()` returns `undefined` on deployed production/preview without a valid secret.
- Guarded routes return **503** with `AUTH_SECRET_MISSING` (middleware).
- Password reset signing returns `null`; 2FA token helpers throw if invoked without a secret.
- NextAuth `authOptions.secret` is `undefined`, so session issuance is blocked.

## Verification

```bash
pnpm check:integrations-env   # validates env by deployment tier
pnpm test tests/resolve-nextauth-secret.test.ts
```

Implemented in `lib/auth/nextauth-env.ts` and `middleware.ts`.

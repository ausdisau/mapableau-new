# Recommended patch: production NextAuth secret handling (finding #1)

## Problem

`lib/auth/nextauth-env.ts` currently returns a hardcoded `FALLBACK_SECRET` in production when
`NEXTAUTH_SECRET` is missing. That secret is in the repository, so anyone can forge session JWTs,
password-reset tokens, and 2FA tokens if production is misconfigured.

## Recommended policy

**Fail closed in production.** Do not sign tokens with a repo-known secret. Keep the dev fallback
only for local development and tests.

## Proposed code change

Replace the production branch in `resolveNextAuthSecret()` with:

```typescript
if (process.env.NODE_ENV === "production") {
  console.error(
    "[auth] CRITICAL: NEXTAUTH_SECRET is missing or shorter than 16 characters. Auth is disabled until configured.",
  );
  return undefined;
}
```

Then update NextAuth configuration and middleware to treat a missing secret as a configuration
error:

1. **`pages/api/auth/[...nextauth].ts` (or auth route handler)** — pass `secret: resolveNextAuthSecret()`.
   NextAuth will refuse to issue sessions when `secret` is undefined.
2. **`middleware.ts`** — if `resolveNextAuthSecret()` is undefined, skip `withAuth` and return a
   503 JSON/HTML configuration error for guarded routes instead of accepting forged cookies.
3. **Remove or gate the production fallback test** in `tests/resolve-nextauth-secret.test.ts` so CI
   fails if production would boot without a real secret.

## Deployment guard (recommended)

Add a preflight check to `scripts/check-integrations-env.ts` or Vercel build:

```bash
if [ "$NODE_ENV" = "production" ] && [ -z "$NEXTAUTH_SECRET" ]; then
  echo "NEXTAUTH_SECRET must be set in production" >&2
  exit 1
fi
```

## Trade-off

| Approach | Availability | Security |
| --- | --- | --- |
| Current fallback secret | Auth endpoints stay up | Forgeable tokens if env missing |
| Recommended fail-closed | `/api/auth/*` and guarded routes error until fixed | No forgeable production tokens |

## Approval needed

This is a product/ops decision. Choose one:

- **A. Fail closed (recommended)** — apply the patch above and block deploy without `NEXTAUTH_SECRET`.
- **B. Keep fallback temporarily** — document incident response and set a deadline to remove the fallback.
- **C. Hybrid** — fail closed on Vercel production, keep fallback only in preview/staging with a
  non-repo secret injected by the platform.

No code change for option **A** should ship until you confirm which policy you want.

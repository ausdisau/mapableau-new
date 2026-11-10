# Operator: Clerk development instance for AD.iD

## Do

1. Create or select a **separate Clerk development** application (not production).
2. Copy publishable + secret keys into `apps/adid/.env.local` on your machine — **never paste keys into chat, GitHub, or Wix**.
3. Set sign-in/sign-up URLs to `/sign-in` and `/sign-up`.
4. Keep `ADID_WIX_PUBLIC_LINK_ENABLED`, `ADID_ACCOUNT_LINKING_ENABLED`, `ADID_WIX_SESSION_BRIDGE_ENABLED`, and `ADID_CROSS_APP_FEDERATION_ENABLED` as `false` until each stage is separately approved.
5. Leave Neon directory flags `false` unless a reviewed read-only test branch is approved.
6. Run locally: `npm install`, `npm test`, `npm run typecheck`, `npm run build`, `npm run dev`.
7. Manually verify: sign-in, MFA/passkey recovery, `/dashboard`, `/account`, `/api/identity/me`, sign-out, keyboard, screen reader, 200–400% zoom, reduced motion.

## Do not

- Create production Clerk keys for this sandbox
- Enable Wix session bridge or email-only linking
- Read/write `neon_auth` or application member databases
- Deploy to production Wix domain or existing MapAble production
- Claim cross-app SSO until each relying party has its own verified OIDC client PR

## Vercel preview (after local checks)

- Separate protected Vercel project
- Root directory: `apps/adid`
- Preview protection / SSO required
- Human approval before any DNS or production change

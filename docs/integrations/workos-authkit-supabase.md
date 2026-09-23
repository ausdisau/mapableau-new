# WorkOS AuthKit and Supabase user authentication

MapAble uses WorkOS AuthKit as an optional hosted identity provider inside the
existing NextAuth session. Prisma remains the only authority for MapAble roles,
permissions, and access profiles. WorkOS organization roles and user metadata
must never be copied into `User.primaryRole` or `UserRoleAssignment`.

## Activation order

1. In WorkOS, add these exact redirect URIs for each enabled environment:
   - `https://mapable.com.au/api/auth/callback/workos-authkit`
   - `https://<preview-host>/api/auth/callback/workos-authkit` for a controlled preview
   - `http://localhost:3000/api/auth/callback/workos-authkit` for local development
2. Add `WORKOS_CLIENT_ID` and `WORKOS_API_KEY` as encrypted Vercel environment
   variables. Set `WORKOS_AUTHKIT_ENABLED=true` only in the first environment to
   be tested. Do not expose the API key through a `NEXT_PUBLIC_` variable.
3. Verify sign-in, sign-up, cancellation, refresh, sign-out, keyboard-only use,
   screen-reader labels, and return-to-page behaviour before widening rollout.
4. If Supabase user access is required, configure WorkOS as a Supabase
   third-party auth provider with issuer
   `https://api.workos.com/user_management/<WORKOS_CLIENT_ID>`.
5. In the WorkOS JWT template, override `role` to the literal
   `"authenticated"`. Put any WorkOS organization role in a different claim such
   as `user_role`; MapAble does not use that claim for authorization.
6. Enable Row Level Security and explicit least-privilege policies on every
   table reachable through the Supabase Data API. Test policies with an
   authenticated WorkOS JWT. Do not authorize from editable user metadata.
7. Add `NEXT_PUBLIC_SUPABASE_URL` and the browser-safe
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep `SUPABASE_SERVICE_ROLE_KEY`
   server-only and limited to existing import/admin code.
8. Enable both `SUPABASE_WORKOS_AUTH_ENABLED` and
   `NEXT_PUBLIC_SUPABASE_WORKOS_AUTH_ENABLED` only after steps 4–7 pass.

## Runtime design

- Hosted sign-in requires OAuth state and PKCE.
- First sign-in links a WorkOS subject only by a WorkOS-verified email. Later
  sign-ins resolve the immutable subject link before email.
- The encrypted NextAuth JWT stores WorkOS access and refresh tokens; the public
  NextAuth session does not expose either token.
- `POST /api/auth/supabase-token` is same-origin, authenticated, private, and
  non-cacheable. It returns only a short-lived WorkOS access token.
- `getSupabaseAuthenticatedClient()` supplies that token through Supabase's
  `accessToken` callback and never uses the service-role key.

## Rollback

Set `WORKOS_AUTHKIT_ENABLED=false` to remove the AuthKit button without changing
existing sessions or identity links. Disable both Supabase WorkOS flags to close
the token bridge. Existing password, passkey, MFA, and configured OAuth providers
continue to work throughout rollout and rollback.

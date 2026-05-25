# Auth routes

Auth0 routes are mounted by `@auth0/nextjs-auth0` via root `middleware.ts`:

- `/auth/login` — start Universal Login (Google via Auth0)
- `/auth/callback` — OAuth callback (profile bridge in `lib/auth0/on-callback.ts`)
- `/auth/logout` — end session

MapAble-specific routes:

- `/auth/me` — MapAble profile and onboarding status (no tokens)
- `/auth/callback-handler` — post-login redirect helper

Do not add duplicate `route.ts` files for login/callback/logout unless overriding SDK behavior.

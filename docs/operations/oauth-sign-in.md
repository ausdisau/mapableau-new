# Google and Microsoft sign-in

MapAble uses [NextAuth.js](https://next-auth.js.org/) with optional OAuth providers. Email/password (`credentials`) always remains available.

## Enable providers

Set env vars (see `.env.example`). Buttons on `/login` and `/register` only render when **both** client id and secret are set for a provider.

| Provider  | Env vars                                                                                                                    | Callback URL                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Google    | `GOOGLE_CLIENT_ID`, `GOOGLE_ID`, or `AUTH_GOOGLE_ID`, plus `GOOGLE_CLIENT_SECRET`, `GOOGLE_SECRET`, or `AUTH_GOOGLE_SECRET` | `{NEXTAUTH_URL}/api/auth/callback/google`   |
| Facebook  | `FACEBOOK_CLIENT_ID` or `FACEBOOK_APP_ID`, plus `FACEBOOK_CLIENT_SECRET` or `FACEBOOK_APP_SECRET`                           | `{NEXTAUTH_URL}/api/auth/callback/facebook` |
| Microsoft | `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, optional `AZURE_AD_TENANT_ID`                                               | `{NEXTAUTH_URL}/api/auth/callback/azure-ad` |

Use the same `NEXTAUTH_URL` as production (e.g. `https://your-app.vercel.app`).

### Microsoft tenant

- `AZURE_AD_TENANT_ID=common` — work, school, and personal Microsoft accounts (default).
- Set to your Entra tenant GUID to restrict to a single organisation.

## Behaviour

- First OAuth sign-in **creates** a `participant` user (role assignment + participant/accessibility profiles), same as registration.
- Existing users are matched by **email** and signed in to that account.
- OAuth-only users get a random `passwordHash`; they can set a password later via **Forgot password** if they want email login too.

### Facebook

- In [Meta for Developers](https://developers.facebook.com/), enable **Facebook Login** on the app and add the callback URL above under **Valid OAuth Redirect URIs**.
- Request the **email** permission if you need account linking; sign-in is rejected when Facebook does not return an email address.

## Vercel

Add the same variables in the Vercel project → Settings → Environment Variables for Preview and Production.

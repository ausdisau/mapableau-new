# Alexa account linking (Auth0)

**Claim state: IMPLEMENTED / NOT VERIFIED** — foundation code and checklists only.  
**Real device control: NOT IMPLEMENTED.**  
Do **not** claim “Works with Alexa” until Amazon certification allows it.

## Architecture

```
Amazon Alexa
    │  Authorization Code + PKCE S256
    ▼
Auth0 (Authorization Server)
    │  MapAble identity
    ▼
MapAble account
    │
    ▼
MapAble Home authority
    │
    ▼
Home capability adapters (simulator only in P0)
```

Auth0 / Alexa OAuth means: *this Alexa account is linked to this MapAble user*.  
It does **not** mean Alexa may perform every Home action. Consequential actions still pass MapAble authority / confirmation.

NextAuth remains the MapAble application session layer. Auth0 is the OAuth AS for Alexa linking. Do not turn NextAuth into Alexa’s authorization server.

## Exact Amazon redirect URIs

Issued by the Alexa Developer Console for this skill. Do not change scheme, host, path, casing, or skill-link id:

1. `https://alexa.amazon.co.jp/api/skill/link/M34KSZLLCGM3TX`
2. `https://layla.amazon.com/api/skill/link/M34KSZLLCGM3TX`
3. `https://pitangui.amazon.com/api/skill/link/M34KSZLLCGM3TX`

These belong in **Auth0 Allowed Callback URLs**.  
They do **not** belong in `NEXTAUTH_URL`.  
They do **not** replace `/api/auth/callback/auth0` used by MapAble browser login.

If Amazon later shows additional regional redirect URLs, add them explicitly to this doc **and** Auth0 before enabling that region. Do not invent URLs.

Typed source of truth: `lib/home/adapters/alexa/account-linking-config.ts`.

## Auth0 manual checklist

Do **not** automate Auth0 Management API mutations for this work.

1. Auth0 → Applications → **Create Application**
2. Name: `MapAble Alexa Account Linking`
3. Application type: **Regular Web Application**
4. Settings → **Allowed Callback URLs**: paste all three Amazon URLs (comma/newline separated)
5. Grant Types: **Authorization Code**, **Refresh Token**
6. Token Endpoint Authentication Method: **Client Secret (Basic)**
7. PKCE: S256 compatible
8. If using MapAble Home API (`https://api.mapable.com.au/home` or your Auth0 API identifier): allow **Offline Access** where refresh tokens are required
9. Copy Client ID / Client Secret into deployment secrets only:
   - `AUTH0_ALEXA_CLIENT_ID`
   - `AUTH0_ALEXA_CLIENT_SECRET`
   - `AUTH0_ALEXA_ISSUER` (e.g. `https://YOUR_TENANT.auth0.com/` — normalized without trailing slash internally)
   - `AUTH0_ALEXA_AUDIENCE` (Home API identifier when used)

Do **not** reuse browser-login `AUTH0_CLIENT_*` credentials automatically.

Suggested Auth0 endpoints:

- `{AUTH0_ALEXA_ISSUER}/authorize`
- `{AUTH0_ALEXA_ISSUER}/oauth/token`

## Amazon Developer Console checklist

Account Linking:

| Field | Value |
| --- | --- |
| Grant | Auth Code Grant |
| PKCE Authorization | ON |
| Web Authorization URI | `{AUTH0_ALEXA_ISSUER}/authorize` |
| Access Token URI | `{AUTH0_ALEXA_ISSUER}/oauth/token` |
| Client ID | dedicated Auth0 Alexa app |
| Client Secret | dedicated Auth0 Alexa app |
| Authentication Scheme | HTTP Basic |
| Your Redirect URLs | leave empty for P0 (unless native app-to-app linking is implemented) |
| Default Access Token Expiration | 3600 seconds unless Auth0 overrides |

Suggested scopes (narrow — avoid broad `home:control`):

- `openid`
- `profile`
- `offline_access`
- `home:state:read`
- `home:routine:evaluate`
- `home:routine:run`
- `home:action:propose`

OAuth scope alone must never authorize HIGH / SAFETY_CRITICAL execution.

## Feature flags (default OFF)

| Flag | Purpose |
| --- | --- |
| `MAPABLE_HOME_ENV_ENABLED` | Master Home domain switch |
| `MAPABLE_HOME_ENV_ALEXA_ENABLED` | Alexa adapter scaffolding |
| `MAPABLE_HOME_ENV_ALEXA_ACCOUNT_LINKING_ENABLED` | Link status API / UI |
| `MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED` | Must remain `false` |

Alexa linking is **configured** only when all `AUTH0_ALEXA_*` values are present. Never log client secrets, tokens, codes, or PKCE verifiers.

## MapAble APIs

- `GET /api/home/integrations/alexa` — authenticated link status (no secrets)
- `DELETE /api/home/integrations/alexa` — MapAble-side unlink metadata only (does **not** revoke Auth0/Amazon remotely)

## Accessibility

Any UI showing Alexa connection state must meet WCAG 2.2 AA. Users must be able to review status, understand permissions, and change MapAble Home authority via keyboard, screen reader, touch, and text. AAC-generated text is equivalent to voice input.

## What remains manual / NOT VERIFIED

- Auth0 application + callback URL registration
- Amazon skill account-linking form values
- End-to-end Alexa ↔ Auth0 ↔ MapAble link test
- Remote token revocation
- Real device control (explicitly NOT IMPLEMENTED)

**GO / NO-GO for live Amazon testing:** NO-GO until Auth0 + Amazon checklists are completed by operators and end-to-end linking is verified in a non-production skill.

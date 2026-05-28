# MapAble integration environment variables

Run validation locally:

```bash
pnpm check:integrations-env
```

Secrets are never printed by the check script.

## Core (required in production)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (Prisma) |
| `DIRECT_URL` | Direct connection for migrations (Neon) |
| `NEXTAUTH_SECRET` | Session signing |
| `NEXTAUTH_URL` | App base URL for auth callbacks |

## Optional integrations

Enable with `*_ENABLED=true` or provider-specific flags. Only required variables for **enabled** integrations are validated.

### PostgreSQL (`postgres`)

Always required when the app runs against a database.

### Stripe (`STRIPE_ENABLED=true`)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (webhooks)

### Xero (`XERO_ENABLED=true`)

- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`

### Keycloak (`KEYCLOAK_ENABLED=true`)

- `KEYCLOAK_BASE_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ISSUER_URL`
- `KEYCLOAK_REDIRECT_URI`

### Auth0 (`AUTH0_ENABLED=true`)

Social / enterprise login via NextAuth (alongside email/password).

- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_ISSUER` — full issuer URL, e.g. `https://ad-id.au.auth0.com` (or set `AUTH0_DOMAIN=ad-id.au.auth0.com`)

In the Auth0 application settings, add callback URLs:

- `https://<your-domain>/api/auth/callback/auth0`
- `http://localhost:3000/api/auth/callback/auth0` (local)

Also set **Allowed Logout URLs** and **Allowed Web Origins** to your app origin(s).

`NEXTAUTH_SECRET` and `NEXTAUTH_URL` remain required for sessions.

#### Social login (Google, Facebook, Microsoft)

Enable each connection in the Auth0 dashboard for the **MapAble** application, then sign-in buttons appear on `/login`.

| Provider | Auth0 connection name (default) | Override env |
|----------|----------------------------------|--------------|
| Google | `google-oauth2` | `AUTH0_GOOGLE_CONNECTION` |
| Facebook | `facebook` | `AUTH0_FACEBOOK_CONNECTION` |
| Microsoft (personal) | `windowslive` | `AUTH0_MICROSOFT_CONNECTION` |

For **Microsoft work/school (Entra ID)**, create an **Azure AD** connection in Auth0 and set `AUTH0_MICROSOFT_CONNECTION` to that connection’s name (often not `windowslive`).

Disable a button without disabling Auth0:

- `AUTH0_SOCIAL_GOOGLE_ENABLED=false`
- `AUTH0_SOCIAL_FACEBOOK_ENABLED=false`
- `AUTH0_SOCIAL_MICROSOFT_ENABLED=false`

**Facebook:** In Auth0 → Authentication → Social → Facebook, enable **email** permission so MapAble can link accounts by email.

**Google / Microsoft:** Use the connection’s client ID and secret from Google Cloud / Microsoft Entra as prompted in Auth0.

### MapLibre (`MAP_INTEGRATION_ENABLED` not `false`)

- `NEXT_PUBLIC_MAP_STYLE_URL`
- `NEXT_PUBLIC_MAP_ATTRIBUTION` (recommended)
- `NEXT_PUBLIC_MAP_DEFAULT_LAT`, `NEXT_PUBLIC_MAP_DEFAULT_LNG`, `NEXT_PUBLIC_MAP_DEFAULT_ZOOM`

### Temporal (`TEMPORAL_ENABLED=true`)

- `TEMPORAL_ADDRESS`
- `TEMPORAL_NAMESPACE`
- `TEMPORAL_TASK_QUEUE`

### n8n (`N8N_ENABLED=true`)

- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_WEBHOOK_SECRET`

### Directus (`DIRECTUS_ENABLED=true`)

- `DIRECTUS_URL`
- `DIRECTUS_STATIC_TOKEN` (server-side only)

### Metabase (`METABASE_ENABLED=true`)

- `METABASE_SITE_URL`
- `METABASE_SECRET_KEY` (embed signing, server-side only)

### FHIR (`FHIR_PROVIDER=medplum` or `hapi`)

Medplum: `MEDPLUM_BASE_URL`, `MEDPLUM_CLIENT_ID`, `MEDPLUM_CLIENT_SECRET`  
HAPI: `HAPI_FHIR_BASE_URL`

### Telehealth (`TELEHEALTH_VIDEO_PROVIDER=jitsi` or `livekit`)

Jitsi: `JITSI_BASE_URL`  
LiveKit: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

### Scheduling (`SCHEDULING_PROVIDER=calcom`)

- `CALCOM_API_KEY`
- `CALCOM_BASE_URL`

### ERPNext (`ERPNEXT_ENABLED=true`)

- `ERPNEXT_BASE_URL`
- `ERPNEXT_API_KEY`
- `ERPNEXT_API_SECRET`

### Realtime

- Supabase Realtime: `SUPABASE_REALTIME_ENABLED=true` + Supabase URL/keys
- Socket.IO: `SOCKETIO_ENABLED=true`, `SOCKETIO_SERVER_URL`
- Feature flag: `REALTIME_PROVIDER=supabase|socketio|polling`

## Local development example

```env
DATABASE_URL=postgresql://localhost:5432/mapable
NEXTAUTH_SECRET=dev-secret-change-me
NEXTAUTH_URL=http://localhost:3000
MAP_INTEGRATION_ENABLED=true
NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
TEMPORAL_ENABLED=false
N8N_ENABLED=false
METABASE_ENABLED=false
```

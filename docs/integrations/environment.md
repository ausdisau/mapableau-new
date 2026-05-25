# MapAble integration environment variables

Run validation locally:

```bash
pnpm check:integrations-env
```

Secrets are never printed by the check script.

## Core (required in production)

| Variable          | Purpose                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection for the app (Prisma; Supabase transaction pooler in production) |
| `DIRECT_URL`      | Direct/session connection for Prisma migrations and schema commands                   |
| `NEXTAUTH_SECRET` | Session signing                                                                       |
| `NEXTAUTH_URL`    | App base URL for auth callbacks                                                       |

## Optional integrations

Enable with `*_ENABLED=true` or provider-specific flags. Only required variables for **enabled** integrations are validated.

### PostgreSQL (`postgres`)

Always required when the app runs against a database.

For Supabase-hosted Postgres, keep Prisma as the ORM:

- `DATABASE_URL`: Supavisor transaction pooler URL, usually port `6543`, with `pgbouncer=true`.
- `DIRECT_URL`: Supavisor session pooler or direct URL, usually port `5432`, used by Prisma migrations.
- Use a dedicated Supabase database role for Prisma rather than the default dashboard role when possible.

Do not run `prisma db push`, `prisma migrate deploy`, or destructive data copy commands against a live Supabase project until the target project, credentials, backup, and migration window are confirmed.

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

- Supabase Realtime: `SUPABASE_REALTIME_ENABLED=true`, `REALTIME_PROVIDER=supabase`, `NEXT_PUBLIC_REALTIME_PROVIDER=supabase`, plus Supabase URL/public key
- Socket.IO: `SOCKETIO_ENABLED=true`, `SOCKETIO_SERVER_URL`
- Feature flag: `REALTIME_PROVIDER=supabase|socketio|polling`

### Supabase (`SUPABASE_ENABLED=true`)

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted for older projects)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only; never expose as `NEXT_PUBLIC_*`)

For Supabase document storage, set `DOCUMENT_STORAGE_MODE=supabase` or `DOCUMENT_STORAGE_BACKEND=supabase` and configure:

- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local development example

```env
DATABASE_URL=postgresql://localhost:5432/mapable
DIRECT_URL=postgresql://localhost:5432/mapable
NEXTAUTH_SECRET=dev-secret-change-me
NEXTAUTH_URL=http://localhost:3000
MAP_INTEGRATION_ENABLED=true
NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
SUPABASE_ENABLED=false
REALTIME_PROVIDER=polling
NEXT_PUBLIC_REALTIME_PROVIDER=polling
TEMPORAL_ENABLED=false
N8N_ENABLED=false
METABASE_ENABLED=false
```

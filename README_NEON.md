# Connect MapAble to Neon

MapAble uses Prisma with PostgreSQL. [Neon](https://neon.tech) is a supported host for development and production.

## 1. Create a Neon project

1. Sign in at [https://console.neon.tech](https://console.neon.tech)
2. Create a project (e.g. `mapable-dev`)
3. Open **Dashboard → Connect** and copy the connection strings

You need **two** URLs:

| Variable | Neon dashboard | Use |
|----------|----------------|-----|
| `DATABASE_URL` | **Pooled** connection (hostname contains `-pooler`) | Next.js app at runtime |
| `DIRECT_URL` | **Direct** connection (no `-pooler`) | `prisma db push`, `migrate`, `seed` |

Add `?sslmode=require` if it is not already in the string.

## 2. Configure `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://...@ep-xxxx-pooler....neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxxx....neon.tech/neondb?sslmode=require"
```

Keep `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and other vars from `.env.example`.

**Local Postgres:** set `DIRECT_URL` to the same value as `DATABASE_URL`.

## 3. Apply schema and seed

```bash
npx prisma db push
npx prisma generate
pnpm prisma db seed
```

`db push` uses `DIRECT_URL`. The running app uses `DATABASE_URL` (pooled on Neon).

## 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000/core](http://localhost:3000/core) after the server shows **Ready**.

## MapAble Neon project (this repo)

| | |
|---|---|
| **Neon project** | `mapableau` (`cold-paper-45965334`) |
| **Region** | `aws-ap-southeast-2` |
| **Default branch** | `production` |
| **Database** | `neondb` |

Refresh local `.env` from a pooled connection string (Neon console or Cursor Neon MCP → `get_connection_string`):

```bash
cp .env.example .env
python3 scripts/configure-neon-env.py 'postgresql://USER:PASS@ep-xxx-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require'
```

Verify connectivity:

```bash
set -a && source .env && set +a
npx prisma migrate status
```

## Vercel (`mapableau-new`)

| | |
|---|---|
| **Team** | `mapableau` |
| **Project** | `mapableau-new` (`prj_iAhQk0b6IhigXw58PFiYfiHSATmW`) |
| **Repo** | `ausdisau/mapableau-new` |

`vercel.json` runs `prisma generate && next build` on deploy so the Prisma client matches `schema.prisma` (including Communication Centre models).

### Sync Neon → local `.env` → Vercel

1. Copy a **pooled** connection string from [Neon console](https://console.neon.tech) (project `mapableau`) or Cursor Neon MCP `get_connection_string`.
2. From repo root:

```bash
cp .env.example .env
pnpm neon:sync 'postgresql://USER:PASS@ep-xxx-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require'
```

This updates `DATABASE_URL` / `DIRECT_URL` in `.env` and generates `scripts/vercel-env-push.sh`.

3. Push env vars to Vercel (requires [Vercel CLI](https://vercel.com/docs/cli) and `vercel login`):

```bash
pnpm vercel:env:push
# or: pnpm neon:sync '<url>' --push-vercel
```

4. Before `vercel:env:push`, set production URLs in `.env` (used as the source of truth):

```env
NEXTAUTH_URL="https://mapableau-new-mapableau.vercel.app"
NEXT_PUBLIC_APP_URL="https://mapableau-new-mapableau.vercel.app"
REALTIME_DRIVER="memory"
```

5. **Redeploy** Production and Preview so functions load the new variables (merge `cursor/communication-centre-e3d6` or redeploy from Vercel dashboard).

### Environment variables (Production, Preview, Development)

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon **pooled** URL (`-pooler` in hostname) |
| `DIRECT_URL` | Neon **direct** URL (no `-pooler`) |
| `NEXTAUTH_SECRET` | Strong random secret (same across envs or per-env) |
| `NEXTAUTH_URL` | `https://mapableau-new-mapableau.vercel.app` or your production domain |
| `NEXT_PUBLIC_APP_URL` | Same as public site URL |
| `NDIS_ENCRYPTION_KEY` | Strong random secret |
| `REALTIME_DRIVER` | `memory` (default), `supabase`, or `socketio` |
| `NEXT_PUBLIC_SUPABASE_URL` | If using Supabase Realtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | If using Supabase Realtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Server broadcast only (optional) |
| `NEXT_PUBLIC_REALTIME_GATEWAY_URL` | If using Socket.IO gateway |
| `REALTIME_INTERNAL_KEY` | Protects gateway `/internal/publish` |

Copy values from your local `.env` (never commit `.env`). Or install the [Neon Vercel integration](https://vercel.com/marketplace/neon) — it can inject `DATABASE_URL` / `POSTGRES_URL`; you still need `DIRECT_URL` for CI migrations.

### Communication Centre on Neon

Tables are applied via migration `20260525000000_communication_centre`. If `migrate deploy` fails due to history drift, the SQL was applied with:

```bash
set -a && source .env && set +a
npx prisma db execute --schema prisma/schema.prisma \
  --file prisma/migrations/20260525000000_communication_centre/migration.sql
npx prisma migrate resolve --applied 20260525000000_communication_centre
```

Conference and AAC tables: migration `20260525120000_conference_aac` (see [README_CONFERENCING.md](README_CONFERENCING.md)). Add Vercel env vars `CONFERENCE_PROVIDER`, `DAILY_API_KEY`, `DAILY_DOMAIN`, `NEXT_PUBLIC_DAILY_DOMAIN` when using Daily.co.

## Cursor + Neon MCP (optional)

In Cursor, enable the **Neon** MCP server and complete authentication. Then you can list projects and connection details from the IDE without leaving the editor.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Environment variable not found: DATABASE_URL` | Create `.env` from `.env.example` |
| `Environment variable not found: DIRECT_URL` | Set `DIRECT_URL` (copy direct Neon URL, or duplicate `DATABASE_URL` locally) |
| `Can't reach database server` | Wrong URL, project paused, or IP allowlist — resume project in Neon console |
| `P1001` / timeout under load | Use **pooled** `DATABASE_URL` for the app, not the direct URL |
| Migration / push errors | Use **direct** `DIRECT_URL`, not the pooler host |
| `migrate status` shows divergent histories | Neon may have been migrated from another branch/repo; use `prisma migrate deploy` after baselining, or a fresh Neon branch for dev — avoid `--force-reset` on production without a backup |

## Security

- Never commit `.env` or paste production passwords into git
- Use Neon **roles** and separate branches for dev vs production when possible

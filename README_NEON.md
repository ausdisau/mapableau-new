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

The Vercel project is linked to GitHub `ausdisau/mapableau-new`. Add these **Environment Variables** in [Vercel → mapableau-new → Settings → Environment Variables](https://vercel.com/mapableau/mapableau-new/settings/environment-variables) for **Production**, **Preview**, and **Development**:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon **pooled** URL (`-pooler` in hostname) |
| `DIRECT_URL` | Neon **direct** URL (no `-pooler`) |

Copy the same values from your local `.env` (do not commit `.env`). Alternatively, install the [Neon Vercel integration](https://vercel.com/marketplace/neon) on the project — it can provision `DATABASE_URL` automatically.

Redeploy after saving env vars so serverless functions pick up the database connection.

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

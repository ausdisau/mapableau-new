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

## Neon Data API (REST)

The **Data API** is a separate HTTP interface (PostgREST-compatible), not the same as Prisma’s `DATABASE_URL`.

Example base URL:

```text
https://ep-old-wildflower-a72yuev6.apirest.ap-southeast-2.aws.neon.tech/neondb/rest/v1
```

| Use case | Connection |
|----------|------------|
| MapAble app, Prisma, migrations | `DATABASE_URL` / `DIRECT_URL` (PostgreSQL, from **Connect**) |
| Browser / serverless REST queries | Data API URL + **JWT** in `Authorization: Bearer` |

**1. Enable Data API** in [Neon Console](https://console.neon.tech) → your project → **Data API** (and optionally **Neon Auth**).

**2. Add to `.env`:**

```env
NEON_DATA_API_URL="https://ep-<branch-id>.apirest.ap-southeast-2.aws.neon.tech/neondb/rest/v1"
```

**3. Test (needs a valid JWT from Neon Auth or your IdP):**

```bash
curl "https://ep-old-wildflower-a72yuev6.apirest.ap-southeast-2.aws.neon.tech/neondb/rest/v1/Provider?select=id,name&limit=5" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Accept: application/json"
```

Without a token you get: `missing authentication credentials` — that confirms the endpoint is up.

**4. Prisma on the same Neon project** — still use **Connect → PostgreSQL**, not the REST URL:

```env
DATABASE_URL="postgresql://...@ep-old-wildflower-a72yuev6-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-old-wildflower-a72yuev6.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"
```

Copy user/password from the console; the host must match your branch (`ep-old-wildflower-a72yuev6` vs other projects like `ep-calm-dream-...`).

Docs: [Neon Data API](https://neon.com/docs/data-api/get-started)

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

## Security

- Never commit `.env` or paste production passwords into git
- Use Neon **roles** and separate branches for dev vs production when possible

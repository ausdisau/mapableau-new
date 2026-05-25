# Connect MapAble to Supabase

MapAble uses Prisma as the ORM and can run against Supabase Postgres without changing the Prisma schema. Supabase is the preferred hosted Postgres target, while local Postgres remains supported for development.

## 1. Prepare Supabase Postgres

Create or select a Supabase project, then create a dedicated database role for Prisma from the Supabase SQL editor. Supabase recommends a custom Prisma user so database access is easier to audit and tune.

```sql
create user "prisma" with password 'replace-with-a-generated-password' bypassrls createdb;
grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

## 2. Configure Prisma URLs

Set these in `.env` and in Vercel for every environment that should use Supabase:

```env
DATABASE_URL="postgresql://prisma.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://prisma.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"
```

`DATABASE_URL` is used by the running Next.js app. `DIRECT_URL` is used by Prisma migrations and schema commands. For local Postgres, both can point at the same local database.

## 3. Configure Supabase APIs

Only enable these when the project should use Supabase APIs such as Storage or Realtime:

```env
SUPABASE_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` only for older Supabase projects that do not have publishable keys yet. Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_*` variable.

For Realtime:

```env
SUPABASE_REALTIME_ENABLED=true
REALTIME_PROVIDER=supabase
NEXT_PUBLIC_REALTIME_PROVIDER=supabase
```

For document storage:

```env
DOCUMENT_STORAGE_MODE=supabase
DOCUMENT_STORAGE_BACKEND=supabase
SUPABASE_STORAGE_BUCKET=mapable-private-documents
```

Create the storage bucket in Supabase before enabling storage in production. Keep private document access controlled on the server; do not make sensitive buckets public.

## 4. Validate before migrating data

Run local validation after setting env vars:

```bash
pnpm check:integrations-env
pnpm type-check
```

This repository does not perform a live data migration automatically. Before moving production data, confirm the target Supabase project, take a backup of the source database, apply Prisma migrations with `pnpm prisma migrate deploy`, and verify the app against Supabase before switching production traffic.

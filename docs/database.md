# Database workflow

MapAble uses **Prisma** with PostgreSQL (Neon or local).

## Local setup

```bash
cp .env.example .env
# Set DATABASE_URL and DIRECT_URL

npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts
```

## Reset (development only)

```bash
npx prisma migrate reset
```

## Remaining systems models

Models for privacy, NDIS integration layer, passkeys, SSO, offline sync, verticals, and QA checklists are defined at the end of `prisma/schema.prisma` (remaining systems extension).

## Seeds

Fictional demo data only. See `prisma/seed.ts` and `prisma/seed-mapable-*.ts`.

# Deployment

MapAble deploys to Vercel with PostgreSQL (Neon recommended).

## Pre-release

1. `npx tsx scripts/check-env.ts`
2. `npx prisma migrate deploy`
3. `pnpm test`
4. `npx tsx scripts/preflight-release.ts`

## Environment

See `.env.example` for remaining-systems feature flags. Sensitive integrations default off.

## Health

- Public: `GET /api/system/health`
- Version: `GET /api/system/version`

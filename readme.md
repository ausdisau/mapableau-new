# MapAbleAU

MapAble is an accessibility-first disability services platform by Australian Disability Ltd. Built with Next.js App Router, TypeScript, Prisma, and PostgreSQL (Neon).

## Quick start

```bash
pnpm install
cp .env.example .env
# Set DATABASE_URL and DIRECT_URL
pnpm exec prisma migrate deploy
pnpm dev
```

Visit [http://localhost:3000/core](http://localhost:3000/core) for the platform hub.

## Structure

- `app/` — routes and API handlers
- `components/` — React UI
- `lib/` — domain services
- `types/` — shared TypeScript types
- `prisma/` — schema and migrations

## Module documentation

See [README_MODULE_INDEX.md](README_MODULE_INDEX.md) for links to per-module guides.

## Scripts

- `pnpm dev` — development server (Turbopack)
- `pnpm build` — production build
- `pnpm test` — Vitest unit tests
- `pnpm type-check` — TypeScript

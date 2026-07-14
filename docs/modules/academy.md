# MapAble Academy

Disability-led learning and development for disability support workers and NDIS service providers. Bounded context under `/academy`, integrated with MapAble Core (NextAuth/Auth0 identity, organisations, audit, notifications, accessibility preferences, consent).

## Positioning

- Not a clone of commercial training catalogues; original content only.
- Certificates of Completion — never marketed as AQF qualifications or “guaranteed compliant”.
- Completions always reference an immutable `CourseVersion`.

## Routes

Public: `/academy`, `/academy/catalogue`, `/academy/courses/[slug]`, `/academy/pathways/[slug]`, `/academy/about`, `/academy/accessibility`, `/academy/credentials/verify/[publicId]`

Learner: `/academy/learn`, `/academy/record`, `/academy/credentials`, …

Provider: `/academy/provider/...`

Studio: `/academy/studio/...`

## Data

Prisma models (`academy_*` tables) on Neon Postgres with RLS policies in migration `20260714020000_mapable_academy_mvp`. Application capability checks in `lib/academy/authz` remain mandatory.

Seed: `MapAble Worker Foundations` via `lib/academy/seed` (fictional examples + public source links).

## Config

See `.env.example` (`ACADEMY_*`). Do not put service-role keys in browser code.

## Testing

Vitest suites under `tests/academy/`. Playwright + axe scaffolding in `tests/academy/e2e/` (install Playwright when running browser DoD checks).

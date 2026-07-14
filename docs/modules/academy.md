# MapAble Academy

Disability-led learning and development for disability support workers and NDIS service providers. Bounded context under `/academy`, integrated with MapAble Core (NextAuth/Auth0 identity, organisations, audit, notifications, accessibility preferences, consent).

## Positioning

- Not a clone of commercial training catalogues; original content only.
- Certificates of Completion — never marketed as AQF qualifications or “guaranteed compliant”.
- Completions always reference an immutable `CourseVersion`.

## Routes

Public: `/academy`, `/academy/catalogue`, `/academy/catalogue/[courseCode]`, `/academy/courses/[slug]`, `/academy/pathways`, `/academy/pathways/[code]`, `/academy/about`, `/academy/accessibility`, `/academy/credentials/verify/[publicId]`

Learner: `/academy/learn`, `/academy/record`, `/academy/credentials`, …

Provider: `/academy/provider/...`

Studio: `/academy/studio/...`

Admin: `/academy/admin/catalogue`, `/academy/admin/imports`, `/academy/admin/imports/[runId]`

## Data

Prisma models (`academy_*` tables) on Neon Postgres with RLS policies in migrations `20260714020000_mapable_academy_mvp` and `20260714040000_mapable_academy_catalogue`. Application capability checks in `lib/academy/authz` remain mandatory.

Seed: `MapAble Worker Foundations` (`MWF-001`) via `lib/academy/seed` (fictional examples + public source links) — kept outside the master catalogue import.

### Master catalogue (142 courses)

Workbook: `docs/academy/MapAble_Academy_Master_Course_Catalogue.xlsx`  
JSON projection: `data/academy/catalogue-workbook.json` (preferred import source)

- Imports extend the existing `Course` model (publication status defaults to `PLANNED`).
- Public catalogue lists **PUBLISHED** courses only.
- HIS theory and practical-assessment courses block Certificate of Completion issuance until competency pathways exist.
- Import CLI: `pnpm academy:catalogue:import` (dry-run default; `--apply` to write).

See `docs/academy/README.md` for import refresh steps.

## Config

See `.env.example` (`ACADEMY_*`). Do not put service-role keys in browser code.

## Testing

Vitest suites under `tests/academy/`. Playwright + axe scaffolding in `tests/academy/e2e/` (install Playwright when running browser DoD checks).

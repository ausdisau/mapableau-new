## Learned User Preferences
- For attached implementation plans, leave the plan file unchanged and reuse the existing todos instead of recreating them.
- When approved to proceed on a MapAble plan, the user prefers autonomous follow-through across all todos rather than stopping after the first phase.
- If the checkout is conflicted, dirty, or has unrelated changes, use a clean isolated workspace or worktree for validation/fixes and avoid destructive git commands.

## Learned Workspace Facts
- MapAble is an accessibility-first disability care and support platform for participants, nominees/family supporters, providers, workers, drivers, allied health practitioners, support coordinators, plan managers, employers, and administrators.
- MapAble's source of truth stays in MapAble-owned domain data for participants, providers, workers, bookings, access needs, consent, invoices, quality, safeguarding, and outcomes; external frameworks should act as adapters or engines.
- The repo uses root-level `app/`, `components/`, `lib/`, and `types/` directories rather than a `src/` tree.
- The primary persistence stack is Prisma with PostgreSQL/Neon and app-layer auth/access patterns; do not introduce Supabase or RLS unless explicitly requested.
- Several prompt packs mention Supabase/Postgres, but prior MapAble plans consistently resolved them to Prisma/Neon while keeping the schema Supabase-compatible where reasonable.
- MapAble Access keeps public place accessibility reviews and ratings in MapAble's database, separate from OpenStreetMap or Google Maps data.
- The uploaded `MapAble.kml` for MapAble Access is a NetworkLink to a Google My Maps KML feed, so access imports need to support following allowlisted NetworkLink sources.
- `mapabl.au` is the Wix-hosted marketing site; the app supports embedding Provider Finder and autocomplete calls from that domain.

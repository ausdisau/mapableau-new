# Platform gap analysis

Admin operators and developers use **Platform gap analysis** to see what is missing, partial, or intentionally deferred across MapAble — in one filterable view.

**URL:** `/admin/platform-gaps` (admin role required)

For the **full public launch** checklist, gate criteria, and scope boundaries, see [Full public launch](full-public-launch.md).

## What it covers

| Category | Examples |
|----------|----------|
| `product` | Master BP surface, Care/Transport/Jobs limits, Core UI roadmap |
| `integration` | OSS pack stubs, env-off engines, health of live adapters |
| `tenancy_auth` | Provider billing scope, dual auth paths |
| `launch_ops` | Items mirrored from the launch readiness checklist |
| `compliance_ndis` | NDIA submission flags, no auto-commission policy |

## How status works

1. **Detected status** — recomputed on each page load from detectors in `lib/platform-gaps/detectors/`.
2. **Effective status** — manual override from the database if set; otherwise mapped from detected status.
3. **Overrides** — admins can set `open`, `in_progress`, `mitigated`, `accepted_risk`, or `closed` with optional notes. Changes are audited (`platform_gap.override_updated`).

The UI shows both values when an override exists, e.g. “Detected: open · Override: accepted_risk”.

## Related surfaces

- **Launch readiness** (`/admin/launch-readiness`) — operational checklist; `launch_ops` gaps sync from shared `LaunchReadinessItem.code` values.
- **Integrations** (`/admin/integrations`) — live health; integration gaps link here for evidence.
- **Core ecosystem** (`/core#ecosystem`) — public roadmap tiles; product gap `bp.satellite_apps` tracks roadmap-only apps.

Platform gap analysis does **not** replace the launch checklist or integration dashboard.

## Adding a gap

1. Add a catalog entry in `lib/platform-gaps/gap-catalog.ts` with a stable `code`, category, severity, baseline, and `evidenceLinks`.
2. Optionally set `detector` to a key implemented in `lib/platform-gaps/detectors/index.ts`, or use `static_open` / `static_partial` / `static_met` for manual-only items.
3. For launch checklist mirrors, set `launchItemCode` to match `LaunchReadinessItem.code` and use `launch_item_sync`.
4. Run `pnpm exec vitest run tests/platform-gap-analysis.test.ts`.

## API

- `GET /api/admin/platform-gaps` — full analysis summary (admin).
- `PATCH /api/admin/platform-gaps` — body `{ code, status, notes? }` upserts `PlatformGapOverride`.

## Schema

`PlatformGapOverride` in Prisma stores per-gap overrides (`code` unique). Apply migrations with your usual Prisma workflow before using overrides in production.

## Out of scope (v1)

- Provider-facing gap UI
- Jira/Linear sync
- Runtime parsing of Master Business Plan documents
- Auto-fixing gaps

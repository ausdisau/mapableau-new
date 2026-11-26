# Import MapAble-for-Care from Replit

Source Repl: [MapAble-for-Care](https://replit.com/@ausdisau1/MapAble-for-Care) (`@ausdisau1`).

This repository (`ausdisau/mapableau-new`) already implements MapAble Care as part of the monolith. Use this guide when you need to pull changes from the Replit-hosted Repl or reconcile a standalone care app with production code.

## Passenger journey

The public passenger practice flow is a native Next.js port of the MapAble-for-Care Repl at
`ae09dac1d2af92de1ecf03acde9e9afa30355e45`. Its source screen is
`client/src/pages/transport/PassengerTransportPage.tsx`. The Repl has a fetch remote
named `mapable-site` pointing to this repository. Future passenger changes are reviewed here before deployment.

| Replit entry | Website entry | Data passed |
| --- | --- | --- |
| Transport / My trips | `/transport/passenger` | Browser-local practice trips |
| Care / Plan transport | `/transport/passenger?plan=appointment` | Sydney calendar date and time, consumed once from session storage |
| Signed-in transport links | `/transport/request` and `/transport/dashboard` | Standard sign-in with no practice payload |

The sample quote, driver and trip stages run on the device. Driver-note preview and withdrawal
are scoped to the selected practice trip. The target hostname `mapableau-new.vercel.app` belongs
to the `mapableau` Vercel project for this repository.

```sh
pnpm test tests/transport-passenger-practice.test.tsx tests/transport-passenger-appointment.test.tsx tests/transport-public-ui.test.tsx tests/peer-middleware.test.ts
```

## Quick import (git)

```bash
chmod +x scripts/import-replit-care.sh
./scripts/import-replit-care.sh
```

If the default remote fails (Replit often requires auth), copy the HTTPS git URL from the Repl’s **Version control** tab and run:

```bash
REPLIT_GIT_URL='https://<your-replit-git-remote>' ./scripts/import-replit-care.sh
```

The script clones into `/tmp/mapable-for-care-replit` by default (`IMPORT_DIR` to override).

Or import both Care and Unified together:

```bash
./scripts/import-replit-mapable.sh both
```

## What is already in this repo

| Area | Location |
| --- | --- |
| Participant UI | `/care`, `/care/request`, `/care/bookings`, `/care/service-logs` |
| Provider UI | `/provider/care`, `/provider/care/requests`, `/provider/care/roster` |
| Worker UI | `/worker/today`, `/worker/shifts/[id]`, `/worker/service-log` |
| APIs | `app/api/care/*` |
| Domain | `lib/care/` (bookings, assignments, service logs, eligibility) |
| Schema | `prisma/schema.prisma` (`CareRequest`, `CareBooking`, `CareServiceLog`, …) |
| Module registry | `app/lib/modules.ts` → `href: "/care"` |
| Docs | [docs/modules/care.md](../modules/care.md) |

## Merge checklist

1. **Schema** — Diff Replit models against `prisma/schema.prisma` (care tables listed in care.md).
2. **Auth** — Map Replit users to NextAuth `User` + `UserRoleAssignment` (`care:read:self`, `care:write:provider`, worker roles).
3. **API** — Extend `app/api/care/*` and `lib/care/*`; avoid parallel care stacks.
4. **UI** — Port pages into `app/care/` and provider/worker routes; keep Core shell and accessibility patterns.
5. **Privacy** — Respect `care.accessibility_share` consent before exposing participant access needs.
6. **Verify** — `pnpm test tests/care-mvp.test.ts` and [docs/qa/phase-3.md](../qa/phase-3.md).

## Deployment target

Production for this codebase is documented in [neon.md](./neon.md) (Vercel project linked to `ausdisau/mapableau-new`). Replit Reserved VM deployments are separate; after merge, deploy via the main repo only.

## When automated import is blocked

Cloud agents cannot pass Replit’s Cloudflare challenge. Provide either:

- A **git remote URL** with credentials, or
- A **zip export** from Replit placed in the workspace for a one-off merge.

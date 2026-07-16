# Production roadmap

## Completed in Living Building vertical slice

1. Prisma Living persistence (twin meta, drafts, traces, staff, snapshots) behind env flags
2. NextAuth venue gates (demo role headers ignored when demo mode off)
3. Typed live adapters with last-known snapshot/evidence fallback
4. Visit / Learn (Interview L3 UI) / Operate / Improve product surfaces for A–D walkthrough

## Next three production priorities

1. Full Prisma repository for passports / places / graphs (retire forced demo repo)
2. Durable consent grants + staff assignment admin UI
3. Real BMS wiring + optional Playwright A–D smoke

Still mocked/external: live venue messaging, transport GTFS, assessor field apps, vector search. A real BMS is only connected when `ACCESS_INTELLIGENCE_BMS_URL` points at a working endpoint.

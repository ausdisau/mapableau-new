# Access Signals (synthetic placemaking RAG)

Flag: `MAPABLE_ACCESS_SIGNALS_ENABLED` (default off; production hard-off).

## Journeys

| Audience | Route | Guard |
|---|---|---|
| Public demo | `/access-signals` | flag |
| Assessor | `/assessor/access-signals` | `assessor:portal` + flag |
| Admin | `/admin/access/signals` | `requireAdmin` + flag |

## Non-goals

- Live classifications or GAIS promotion  
- Production Prisma migrations  
- Enabling Access Graph / Infrastructure flags  
- Changing `/accessibility-map` production presentation  
- Touching Navigate PR #13  
- Compliance / certification claims  

## Drive / GAIS package

Google Drive framework docs were **not reconciled** in this environment. Treat Drive reconciliation as an open gate before any controlled pilot.

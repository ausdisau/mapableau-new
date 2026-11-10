# MapAble One tranche — security findings and rollback

## Security / privacy findings (AccessiMart source)

| Finding | MapAble response |
| --- | --- |
| Unauthenticated admin/stats exposing quote/order PII | Not imported |
| In-memory cart keyed by guessable session UUID | Not imported |
| Fake checkout creating orders without payment | Not imported |
| Quote list without sessionId returns all PII | Not imported |
| Dropship fulfillment + API keys / webhooks | Not imported |
| Amazon / AliExpress external search | Not imported |
| Seed suppliers marked `verified` without evidence | Adapter forces `not-verified` |
| `maximum-scale=1` viewport | Not ported; review UI allows zoom |
| Real brand names in seed | Fictionalised in synthetic fixtures |

## Remaining blockers (release NO-GO)

- Disability-led WCAG 2.2 AA review with disabled testers
- Human approval before any flag enablement
- No production deploy / no merge to `main` without review
- CripSquare federation, MapAble Day route and live commerce remain out of scope
- MapAble PR #10 / #32 / #35 not merged or modified by this tranche

## Rollback

1. Ensure `MAPABLE_ACCESSIMART_REVIEW_ENABLED=false` (default).
2. Clear `MAPABLE_ACCESSIMART_REVIEW_TESTER_IDS` if previously set in a preview env.
3. Revert feature commits on `feature/mapable-ecosystem-accessimart-cripsquare-20261110` if needed.
4. No Prisma migrations were introduced — nothing to roll back in Neon/Postgres for this tranche.

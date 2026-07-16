# Access Intelligence Expansion Programme

Implementation follows Waves 0–5 from the production expansion plan.

| Wave | Systems | Status in codebase |
|------|---------|--------------------|
| 0 | Canonical AccessPlace / consent / audit | `WAVE0_CANONICALISATION.md` |
| 1 | Reliability (1) + Regression lab (10) | `lib/access-intelligence/reliability`, `regression` |
| 2 | Journey (2) + Mission console (8) | `journey`, `missions` |
| 3 | Guides (3), Mapper (4), Events (5) | `guides`, `mapper-kit`, `events` |
| 4 | Employment (9) + Widget/SDK (6) | `employment`, `widget`, `packages/@mapable/*` |
| 5 | Regional control tower (7) | `regional` |

All programme flags default **off** except Wave 0 canonical binding. See `.env.example`.

Migration: `prisma/migrations/20260716180000_access_intelligence_expansion_waves`.

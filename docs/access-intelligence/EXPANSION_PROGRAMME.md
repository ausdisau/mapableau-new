# Access Intelligence Expansion Programme

Implementation follows Waves 0–5 from the production expansion plan.

| Wave | Systems | Status in codebase |
|------|---------|--------------------|
| 0 | Canonical AccessPlace / consent / audit | `WAVE0_CANONICALISATION.md` — complete |
| 1 | Reliability (1) + Regression lab (10) | Interactive consoles, scheduler, provenance debugger |
| 2 | Journey (2) + Mission console (8) | Preflight / recovery / offline pack + mission UI |
| 3 | Guides (3), Mapper (4), Events (5) | Composer, field kit, temporary event simulator |
| 4 | Employment (9) + Widget/SDK (6) | Orchestrator UI, SDK packages, certification suite |
| 5 | Regional control tower (7) | Thin-market signals, pilot readiness, `QUALITY_GATES.md` |

All programme flags default **off** except Wave 0 canonical binding. See `.env.example`.

Migration: `prisma/migrations/20260716180000_access_intelligence_expansion_waves`.

Quality gates: `lib/access-intelligence/quality-gates.ts`.

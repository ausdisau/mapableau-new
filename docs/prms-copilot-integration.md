# MapAble PRMS + Co-Pilot Integration

## Product model

- **Co-Pilot** — accessible front door: explains, drafts, suggests. Not the source of truth.
- **PRMS (Participant Record Hub)** — source of truth for profiles, consent, service events, evidence, incidents.
- **Accountability Ledger** — privacy-safe proofs (hashes and references only).

## Sprint 1 (implemented)

| Layer | Path |
|-------|------|
| Types | `lib/copilot/types.ts`, `lib/prms/types.ts`, `lib/ledger/types.ts` |
| Intent router | `lib/copilot/intentRouter.ts` (deterministic, no LLM) |
| Mock PRMS | `lib/prms/mockPrmsData.ts` |
| Context | `lib/copilot/contextBuilder.ts` |
| Module RAG | `lib/rag/interdependent-rag-service.ts` (cross-module retrieval on `/api/mapable/ask`) |
| Action planner | `lib/copilot/actionPlanner.ts` |
| Guardrails | `lib/copilot/guardrails.ts` |
| Ask API | `POST /api/mapable/ask` |
| PRMS APIs | `/api/prms/actions/draft`, `confirm`, `consent/check`, `evidence-packs` |
| Ledger API | `/api/ledger/events` |
| UI | `/ask`, `components/copilot/*` |

## Demo participant

`participant-demo-001` — enable “Use demo participant context” on `/ask`.

## Design rules

1. Co-Pilot never silently books, shares, claims, pays, or closes incidents.
2. Draft records require participant confirmation (and human review when flagged).
3. Ledger events must not contain names, NDIS numbers, addresses, or case notes.

## Next sprints

- `/app` authenticated shell (profile, plan, billing, safety, ledger)
- Prisma PRMS schema + real persistence
- Auth integration on all PRMS routes
- Wire billing branch evidence packs to Stripe/Xero

## Tests

```bash
pnpm test
```

# Access Intelligence — Implementation Plan (Expanded)

## Repository adaptation

| Detected | Choice |
|----------|--------|
| No `src/` root | Use `lib/`, `app/`, `components/`, `tests/` |
| AI SDK 6 | `ToolLoopAgent`, `needsApproval`, `createAgentUIStreamResponse` |
| NextAuth + Prisma | Reuse; demo repository default |
| Prior MVP on this branch | Extend — do not replace engines/chat |

## Gap closure vs expanded product brief

Already present: passports, chat agent, fit/confidence/route engines, demo civic venues, plan card, approvals, Prisma `ai_*` tables.

Adding in this iteration:

1. **Ontology** (`lib/access-intelligence/ontology.ts`) — accreditation-aligned feature metadata
2. **Decision engine package** — thin deterministic package wrapping fit/confidence with explainability
3. **Routing package** — re-export boundary for future PostGIS adapters
4. **MapAble Community Hub** seed venue + scripted demo scenarios
5. **APIs** — places search/detail/graph/live-status, decisions, routes, visit-plans, venue dashboard, pulse reports
6. **Modules** — Explore Places, Access Pulse, Venue Studio, Saved Visit Plans
7. **Remediation priority** calculator for Venue Studio
8. **EvidenceBadge / EvidenceDetails / SuitabilityStatus** components
9. **Docs** — ARCHITECTURE, AI_AGENT, PRIVACY_AND_CONSENT, ACCESSIBILITY
10. **Tests** — decision-engine, remediation, API contract, venue studio role gate

## Architectural direction preserved

- Shared identity via NextAuth user id
- Consent / approval before external writes
- Accreditation scoring remains separate from personal fit
- Typed adapters for unavailable live feeds (demo mock)
- Cross-service reuse via `lib/access-intelligence` exports

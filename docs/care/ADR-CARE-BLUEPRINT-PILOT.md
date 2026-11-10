# ADR: Care Blueprint × Agents SDK × Iris × OpenSearch (Greater Sydney pilot)

## Status

Accepted for controlled pilot engineering. All feature flags **default OFF**. No production claims.

## Context

The Next-Generation Care Platform Blueprint defines MapAble Care as a participant-governed support OS. Delivery combines:

| Asset | Implementation |
|-------|----------------|
| Agents SDK scaffold | `lib/ai/platform/agents-sdk/` — Access → Navigator live; other specialists fail-closed |
| Iris Agent Memory | `lib/ai/memory/iris-agent-memory.ts` — `MAPABLE_IRIS_AGENT_MEMORY_ENABLED=false` |
| OpenSearch | Repo client `lib/search/opensearch-client.ts` (not Opensearch-mcp-server) |
| Brand tokens | `#1C5A96`, `#605B9F` (+ accents) on Care/Navigator pilot chrome |

## Decision

1. **Governance SoT unchanged:** capability registry, Navigator gates, consent/authority, action envelopes, audit.
2. **SDK approval ≠ consent ≠ business authority.**
3. **OpenSearch indexes:**
   - `mapable-care-blueprint-v1` — eng/internal requirements retrieval
   - `mapable_care_discovery_v1` — pilot support-candidate documents; Prisma remains SoT; no pay-to-rank; ranking criteria participant-selected
4. **Care pilot spine** (flags off): support request → multi-option compare → Introduction (request/accept/decline/audit) → agreement → schedule → messaging/incident/invoice handoff → transport **link only**.
5. **Care specialist remains fail-closed** until domain APIs + capability registrations are reviewed.

## Invariants → flags / APIs / indexes

| Invariant | Flag / control | Surface |
|-----------|----------------|---------|
| No auto-assign | Permanent prohibition + Care assignment guards | Agents SDK policy; shift-offer `automaticAssignmentEnabled` |
| No “best match” language | Specialist instructions + evals | `lib/ai/platform/agents-sdk/specialists.ts` |
| AI opt-out | `aiOptedOut` / consent gates | `/api/navigator/pilot/agent-run` |
| Iris memory optional | `MAPABLE_IRIS_AGENT_MEMORY_ENABLED` | `lib/ai/memory/iris-agent-memory.ts` |
| Agents SDK bridge | `MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED` | `/api/navigator/pilot/agent-run` |
| Care introductions | `MAPABLE_CARE_INTRODUCTIONS_ENABLED` | `/api/care/introductions` |
| Blueprint retrieval | OpenSearch index or in-process seed | `lib/search/care-blueprint-index.ts` |
| Care discovery | OpenSearch sync script | `scripts/sync-care-discovery-to-opensearch.ts` |

## Consequences

- Opensearch-mcp-server reconnect is ops-only; CI/runtime must not depend on it.
- No NDIA claim submit, clinical AI, or autonomous dispatch in this programme.
- Upgrading `@openai/agents` is out of scope for the adapter copy-in.

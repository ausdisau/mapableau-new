# MapAble ACSS — AI and Agent Inventory

**Phase:** 0 — Repository Discovery  
**Canonical status:** [`docs/ai-platform/CURRENT_STATE.md`](../ai-platform/CURRENT_STATE.md)

---

## 1. SDKs and providers

| Package | Role |
|---------|------|
| `ai` ^6.0.196 | Vercel AI SDK — `generateObject`, `streamText`, `ToolLoopAgent`, `gateway()` |
| `@ai-sdk/react` | Client `useChat` |
| `@ai-sdk/google` | Google provider |
| `@ai-sdk/openai-compatible` | Self-hosted gpt-oss |
| `@openai/agents` | CareOS / intelligence agent definitions |
| `@modelcontextprotocol/sdk` | Dev dependency for MCP servers |
| `chat` + `@chat-adapter/*` | Provider Finder Slack bot |

**Not present:** LangChain, LangGraph, Anthropic SDK, LlamaIndex.

Replit side path uses OpenAI Node SDK via `package.replit.json` — not the ACSS primary stack.

---

## 2. Model gateway and routing

| File | Purpose |
|------|---------|
| [`lib/ai/platform/models/gateway.ts`](../../lib/ai/platform/models/gateway.ts) | Canonical resolve/call path |
| [`lib/ai/platform/models/registry.ts`](../../lib/ai/platform/models/registry.ts) | Allowlisted models / task allowlists |
| [`lib/search/interpreter/get-model.ts`](../../lib/search/interpreter/get-model.ts) | Search interpreter seam |
| [`lib/ai/platform/policies/kill-switches.ts`](../../lib/ai/platform/policies/kill-switches.ts) | Global / per-capability kills |

Routing factors already considered: kill switch, capability backend, self-host, AI Gateway, Google, deterministic fallback. ACSS “privacy / cost / sensitivity” routing should **extend** this gateway, not fork it.

---

## 3. Capability registry

| File | Purpose |
|------|---------|
| [`lib/ai/platform/capabilities/registry.ts`](../../lib/ai/platform/capabilities/registry.ts) | Registered capabilities |
| [`lib/ai/platform/capabilities/seed.ts`](../../lib/ai/platform/capabilities/seed.ts) | Seed definitions |
| [`lib/ai/platform/capabilities/types.ts`](../../lib/ai/platform/capabilities/types.ts) | Types |
| Docs | [`CAPABILITY_REGISTRY.md`](../ai-platform/CAPABILITY_REGISTRY.md) |

Capabilities bind model/prompt/tools + maturity + feature flags. Agents reference capability keys — they must not duplicate model config.

Production-supported examples (when keys present): `search.nl_interpreter`, `search.access_needs_interpreter`. Many others are controlled_pilot / experimental / synthetic_only and **default off**. Full table: CURRENT_STATE.

---

## 4. Canonical operational agents (eight)

Source: [`lib/ai/platform/agents/manifests.ts`](../../lib/ai/platform/agents/manifests.ts), types in [`types.ts`](../../lib/ai/platform/agents/types.ts).

| ID | Role (summary) | Typical ceiling |
|----|----------------|-----------------|
| `mission_orchestrator` | Coordinates specialists; no domain execute | `READ_ONLY_EXPLAIN` |
| `participant_authority` | Consent, preferences, AAC, non-AI paths | Bounded; never infers consent/capacity |
| `evidence_intelligence` | Authorised evidence + provenance | Never converts inference → fact |
| `access_mobility` | Access + transport analysis | Cannot confirm/dispatch |
| `support_participation` | Care/support analysis | Cannot assign workers / accept agreements |
| `work_participation` | Jobs reasoning | No automatic disability disclosure |
| `continuity_assurance` | Dependency/failure detection → humans | Escalation-oriented |
| `finance_administration` | Invoice/funding explanation | Cannot approve/pay/alter funding |

Supporting modules:

- `registry.ts`, `activation.ts`, `authority.ts`, `validation.ts`, `mission.ts`
- Admin UI: `/admin/ai/agents` (and related monitoring)
- APIs: `GET /api/ai/agents`, `GET /api/ai/agents/:id`, `POST /api/ai/agents/activation-preview`

**Manifest contract fields today:** `id`, `version`, `name`, `description`, `role`, `domains`, `capabilityKeys`, `authorityCeiling`, `activation`, `handoffs`, `requiredConsentScopes`, `requiredHumanReviewFor`, `prohibitedActions`, `fallbackAgentId`, `evaluationSuite`, `owner`, `lastReview`.

**ACSS gap:** No numeric `AutonomyLevel` 0–5; use `AuthorityCeiling` + adapter (see [10-IMPLEMENTATION-ROADMAP.md](./10-IMPLEMENTATION-ROADMAP.md)).

Safeguarding is a **human escalation gate**, not an operational agent. Robotics remains research-only.

---

## 5. CareOS / intelligence agents (legacy / adapter)

| Path | Notes |
|------|-------|
| [`intelligence/agents/`](../../intelligence/agents/) | care, transport, jobs, access, moves, foods, payments, advocate, continuity, safeguarding, robotics, … |
| [`intelligence/orchestrator.ts`](../../intelligence/orchestrator.ts) | `@openai/agents` `Agent` + `run` |
| [`intelligence/tools/registry.ts`](../../intelligence/tools/registry.ts) | Tools |
| [`intelligence/network/`](../../intelligence/network/) | agent-registry, mission-graph, human-review, network-service |

Agentic Nerve Centre doctrine: CareOS `selectCareOSAgentNetwork` is a **deprecated compatibility adapter**. Do not expand parallel registries.

---

## 6. Personal Navigator (pilot)

| Path | Role |
|------|------|
| [`lib/ai/navigator/`](../../lib/ai/navigator/) | Orchestrator, consent gate, memory, passport, matching, envelopes, escalation |
| APIs | `app/api/navigator/pilot/**` (interpret, search, memory, passport, envelopes, escalate, sessions, opt-out) |
| Docs | [`NAVIGATOR_ASSURANCE.md`](../ai-platform/NAVIGATOR_ASSURANCE.md), [`NAVIGATOR_GOVERNED_PILOT_PHASE_0.md`](../ai-platform/NAVIGATOR_GOVERNED_PILOT_PHASE_0.md) |

Capabilities (experimental, mostly flag-off): `navigator.provider_search.interpret|reply|match|draft_service_request|escalate`.

**ACSS target:** Promote Navigator as the primary participant intelligence interface for missions — still behind governance — beyond provider-search pilot scope.

---

## 7. Mission runtime and orchestration

| Module | Path | Flag / status |
|--------|------|---------------|
| Mission runtime | `lib/ai/platform/missions/` | `MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED` — implemented, not production-live; durable store deferred (in-memory) |
| Mission watch | `lib/ai/platform/mission-watch/` | Flag-gated; in-app alerts only |
| Adaptive recovery | `lib/ai/platform/recovery/` | Flag-gated; no auto-execute |
| Context fabric | `lib/ai/platform/context-fabric/` | Flag-gated; provenance-aware context |
| Domain orchestration APIs | `app/api/orchestration/**` | Care-transport, invoices, interview draft |

Docs: [`MISSION_RUNTIME.md`](../ai-platform/MISSION_RUNTIME.md), [`AGENTIC_NERVE_CENTRE.md`](../ai-platform/AGENTIC_NERVE_CENTRE.md).

---

## 8. Governed Action Kernel (Action Gateway precursor)

| Path | Role |
|------|------|
| `lib/ai/platform/actions/` | proposals, approvals, executor, policy, registry, adapters, replay |
| Flag | `MAPABLE_ACTION_KERNEL_ENABLED` |
| Docs | [`GOVERNED_ACTION_KERNEL.md`](../ai-platform/GOVERNED_ACTION_KERNEL.md) |

Flow: propose → approve/reject → deterministic execute via domain adapters. Approval binding + replay exist; **durable persistence deferred** (Prompt 02A class work).

---

## 9. Guardian / policy plane

| Path | Role |
|------|------|
| `lib/ai/platform/guardian/` | Privacy gate, purpose policy, processing router/zones, audit, contracts |
| `lib/ai/governance/` | Governance service |
| `lib/ai/platform/policies/` | Kill switches, safeguarding gate |
| `lib/ai/relational/constitution`, `gates` | Relational intelligence constitution |
| Flag family | `MAPABLE_GUARDIAN_*` default **false** |

Docs: [`UNIFIED_GUARDIAN.md`](../ai-platform/UNIFIED_GUARDIAN.md), guardian threat/processing docs under `docs/ai-platform/guardian/`.

Guardian decisions are typed (`ALLOW`, `DENY_*`, `REQUIRE_PARTICIPANT_CONFIRMATION`, `ROUTE_TO_HUMAN_REVIEW`, …) in `guardian/contracts.ts`. Models emit **inference**, never confirmed facts for safeguarding signals.

---

## 10. Prompts

Versioned prompt governance: [`lib/ai/platform/prompts/registry.ts`](../../lib/ai/platform/prompts/registry.ts)  
Docs: [`PROMPT_GOVERNANCE.md`](../ai-platform/PROMPT_GOVERNANCE.md)

---

## 11. Streaming surfaces

| Path | Notes |
|------|-------|
| `app/api/provider-finder/chat/route.ts` | UI message stream |
| `lib/provider/finder/conversation/stream-assistant.ts` | `streamText` / UI stream helpers |
| `components/guided-search/GuidedSearchDialogue.tsx` | `@ai-sdk/react` `useChat` |
| `server/replit_integrations/chat|audio` | Replit SSE (side path) |

---

## 12. MCP infrastructure

| Path | Role |
|------|------|
| `mcp/av/server.ts` | AV governance tools |
| `mcp/careos/server.ts` | CareOS framework / mission graph / simulation-only robotics |
| `.cursor/mcp.json` | Cursor stdio config |
| Scripts | `mcp:av`, `mcp:careos` in `package.json` |
| Docs | [`docs/av-mcp.md`](../av-mcp.md) |

**Missing for product:** HTTP/SSE MCP host for end users. MCP today is developer/host tooling.

---

## 13. Domain copilots and other agents

| Area | Path |
|------|------|
| Mission / case copilots | `lib/ai/mission-copilot/`, `lib/ai/case-copilot/` |
| Matching | `lib/ai/matching/` |
| Relational intelligence | `lib/ai/relational/` (blocked from production enablement until readiness GO) |
| Disability / booking agents | `lib/agent/disability-services-*.ts`, `booking-services-*.ts` |
| Agent ops / runs | `lib/ai/agent-ops/`, Prisma `AgentRun` |
| Chat modules | `server/chat/modules/*` (safeguarding, transport, shifts, billing, ndis, …) |

---

## 14. Memory and knowledge (inventory)

| Kind | Location | Maturity |
|------|----------|----------|
| Navigator memory | `lib/ai/navigator/memory/` | Pilot / flag-gated |
| Participant memory | `intelligence/memory/participant-memory.ts` | Consent-scoped preferences |
| Context fabric | `lib/ai/platform/context-fabric/` | Flag-gated; in-memory durability deferred |
| Embeddings | `lib/ai/platform/embeddings/types.ts` | **Contracts only** — no live vector store |
| Retrieval | `lib/ai/platform/retrieval/` | Hybrid types / mission evidence graph flag-gated |

---

## 15. ACSS specialist agent mapping (planned evolution)

| ACSS specialist | Closest existing | Recommendation |
|-----------------|------------------|----------------|
| Documentation Agent | `evidence_intelligence` + intake classify/extract | Evolve capabilities; do not invent a second evidence plane |
| Support Coordination Agent | `support_participation` | Cap at INFORM/RECOMMEND/PLAN via authority ceilings |
| Policy Intelligence Agent | Partial (finance/admin explain; prohibited definitive legal conclusions) | New bounded agent **or** capability pack with FACT/INTERPRETATION/INFERENCE/RECOMMENDATION provenance |

---

## Related docs

- [05-ACSS-GAP-MATRIX.md](./05-ACSS-GAP-MATRIX.md)
- [AUTHORITY_MODEL.md](../ai-platform/AUTHORITY_MODEL.md)
- [GOVERNED_ACTION_KERNEL.md](../ai-platform/GOVERNED_ACTION_KERNEL.md)

---

## 16. AI invocation map (source search)

Files that call Vercel AI SDK primitives (`streamText` / `generateObject` / `generateText` / `ToolLoopAgent`) or related agent entrypoints (non-exhaustive; excl. `node_modules` / `amalgamation`):

| File | Kind | Notes |
|------|------|-------|
| `lib/ai/platform/models/gateway.ts` | Gateway | Canonical model resolve |
| `lib/search/interpreter/get-model.ts` | Model | Interpreter model |
| `lib/search/interpreter/parse-query.ts` | Invoke | NL query parse |
| `lib/search/interpreter/resolve-access-needs-llm.ts` | Invoke | Access needs |
| `lib/provider/finder/conversation/stream-assistant.ts` | Stream | Provider Finder |
| `app/api/provider-finder/chat/route.ts` | Route | UI message stream |
| `components/guided-search/GuidedSearchDialogue.tsx` | Client | `useChat` |
| `lib/understanding/understanding-agent.ts` | Agent | `ToolLoopAgent` |
| `lib/agent/disability-services-agent.ts` | Agent | Experimental |
| `lib/agent/booking-services-agent.ts` | Agent | Experimental |
| `app/api/infrastructure/draft/route.ts` | Route | `generateObject` |
| `intelligence/orchestrator.ts` | Orchestrator | `@openai/agents` |
| `intelligence/agents/index.ts` | Agents | CareOS agent defs |
| `lib/intelligence/careos/agents/*.ts` | Agents | Domain careos agents |

Governance for platform capabilities: kill switches + capability registry + guardian (flag-gated). Replit `server/chat/engine.ts` hardcodes OpenAI outside the platform gateway — **do not expand**; bridge or deprecate over time.

---

## 17. Agent classification

| Name / ID | Location | Class |
|-----------|----------|-------|
| Eight MapAble operational agents | `lib/ai/platform/agents/manifests.ts` | **REAL AGENT** (manifest + activation; authority-bounded) |
| `mission_orchestrator` | same | **ORCHESTRATOR** |
| CareOS agents (`careAgent`, …) | `intelligence/agents/` | **REAL AGENT** / adapter path |
| Disability / booking services agents | `lib/agent/*` | **AGENT-LIKE SERVICE** (experimental flags) |
| Understanding agent | `lib/understanding/` | **AGENT-LIKE SERVICE** |
| Navigator pilot | `lib/ai/navigator/` | **ORCHESTRATOR** + tools (pilot) |
| Intake classify/extract | `lib/ai/platform/intake/` | **PROMPT WORKFLOW** / deterministic+synthetic |
| Mission / case copilots | `lib/ai/*-copilot/` | **PROMPT WORKFLOW** / deterministic |
| AURA harness | `lib/aura-harness/` | **TOOL** / risk harness (not Agent OS) |
| MCP AV / CareOS servers | `mcp/*` | **TOOL** (stdio host) |


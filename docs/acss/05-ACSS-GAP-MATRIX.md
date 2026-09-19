# MapAble ACSS — Gap Matrix

**Phase:** 0 — Forensic audit (docs only)  
**Legend:** Gap = EXISTS | PARTIAL | MISSING | UNKNOWN

| ACSS Capability | Existing Implementation | Gap | Recommended Change | Priority |
| --------------- | ----------------------- | --- | ------------------ | -------- |
| Agent Registry | `lib/ai/platform/agents/` (8 manifests, activation, validation) | PARTIAL | Enrich manifests with ACSS autonomy/capability/tool declarations; keep single registry | P0 |
| Agent Contract | `MapAbleAgentManifest` + `AuthorityCeiling` | PARTIAL | Add ACSS adapter types (`AutonomyLevel` mapping); do not fork | P0 |
| Personal Navigator | `lib/ai/navigator/` + pilot APIs | PARTIAL | Promote as primary mission entry beyond provider-search pilot | P1 |
| Agent Orchestrator | `mission_orchestrator` + `lib/ai/platform/missions/` | PARTIAL | Durable store + sequential/parallel specialist plans | P1 |
| Consent Engine | `lib/consent/*`, navigator consent-gate, `ConsentRecord`/`ConsentReceipt` | PARTIAL | Granular agent/tool scopes, expiry, revoke wired into every consequential path | P0 |
| Policy Governor | `lib/ai/platform/guardian/` + action policy + kill switches | PARTIAL | Compose into durable `GovernanceDecision` facade; flags currently off | P0 |
| Risk Engine | Guardian signals, AURA harness, safeguarding gate, behavioral risk matrix | PARTIAL | Formal risk limit in autonomy pipeline; never model-only | P1 |
| Rights / privacy | Guardian privacy/purpose/zones; APP-oriented docs; prohibited actions | PARTIAL | Explicit Rights Governor checks in composed decision | P1 |
| Memory (working) | Mission/context in-memory maps | PARTIAL | Typed working memory per mission; TTL | P2 |
| Memory (profile) | Participant profiles, communication passport, navigator memory | PARTIAL | Consent-scoped profile memory API | P2 |
| Memory (episodic) | Audit events, agent runs, partial history | PARTIAL | Structured episodic event schema | P2 |
| Memory (semantic) | Embeddings types only; no live vectors | MISSING | Knowledge Service + authorised retrieval later | P3 |
| Knowledge Service | Context fabric + retrieval modules (flag-gated) | PARTIAL | Authorisation + provenance wrapper; no arbitrary vector access | P2 |
| Model Gateway | `lib/ai/platform/models/gateway.ts` | EXISTS | Extend routing (sensitivity/cost); keep as SoT | P1 |
| Action Gateway | `lib/ai/platform/actions/` (Governed Action Kernel) | PARTIAL | Persist proposals/approvals; broaden adapters; approval UX | P1 |
| Human Approval | Action approvals + human-review contracts + My MapAble surfaces | PARTIAL | First-class accessible approval primitive for all external actions | P1 |
| Audit Ledger | `AuditEvent` + guardian/connector/chat audits | PARTIAL | Unify consequential AI fields (agent/model/tool/consent/policy) | P1 |
| Durable Workflow | Temporal source + Prisma `WorkflowRun`; mission stores in-memory | PARTIAL | Portable `WorkflowEngine`; Temporal deps absent from package.json — investigate | P2 |
| Background Queue | Domain queues (webhook, trust, safeguarding); no Vercel Queues/BullMQ | PARTIAL | Prefer existing patterns; optional Vercel Queues later | P2 |
| Cron | `vercel.json` NDIS ingest only | PARTIAL | Register ACSS watch/tick crons only when durable | P3 |
| Document Agent | `evidence_intelligence` + intake classify/extract | PARTIAL | Productise Documentation Agent capabilities | P1 |
| Support Coordination Agent | `support_participation` | PARTIAL | Cap INFORM→PLAN; no unrestricted execute | P1 |
| Policy Intelligence Agent | Partial explain surfaces; prohibited definitive legal conclusions | MISSING | New bounded agent with FACT/INTERPRETATION/INFERENCE/RECOMMENDATION | P1 |
| Digital Twin / Scenario Engine | Simulation-only robotics mentions | MISSING | Interfaces only — do not build engine in MVP | P4 |
| MCP Action path | `mcp/av`, `mcp/careos` stdio | PARTIAL | Keep as operator tools; do not expose as unrestricted participant tools | P3 |
| Specialist Housing/Finance/Tech agents | finance_administration, access_mobility, etc. | PARTIAL | Evolve existing; add only when governed | P3 |

## Policy Governor path (gap detail)

Target:

```text
AI → Proposed Action → Consent → Privacy → Rights → Risk → Policy → Human Approval → Action Gateway → External
```

| Step | Status |
|------|--------|
| Proposed Action object | EXISTS (action envelopes) when flag on |
| Consent check | PARTIAL (services exist; not universal on all side effects) |
| Privacy / purpose / zone | EXISTS in Guardian (flags off) |
| Rights | PARTIAL (prohibitions + docs; not a dedicated governor module) |
| Risk | PARTIAL |
| Composed Policy decision record | PARTIAL / MISSING durable |
| Human approval | PARTIAL |
| Action Gateway execute | EXISTS flag-gated; in-memory store |
| Coverage of all side effects | MISSING (many legacy email/SMS/DB paths outside kernel) |

## DO NOT BUILD (reuse instead)

- Second agent registry  
- Second model registry / prompt registry  
- Second auth system  
- Second database  
- Custom Kubernetes / microservice mesh  
- Permanently running agents  
- Unrestricted autonomous execution  
- Parallel “ACSS” package that forks `lib/ai/platform`

See [08-TARGET-DIRECTORY-MAP.md](./08-TARGET-DIRECTORY-MAP.md) and [10-IMPLEMENTATION-ROADMAP.md](./10-IMPLEMENTATION-ROADMAP.md).

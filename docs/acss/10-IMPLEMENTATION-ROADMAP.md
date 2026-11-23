# MapAble ACSS — Implementation Roadmap

**Phase:** 0 complete → **STOP for approval** before Phase 1 code.

## Sequence (adjusted for repository evidence)

Evidence says Model Gateway, Agent Registry, Action Kernel, Guardian, and Navigator **already exist**. Therefore the prompt’s Phase 4 “build Model Gateway” becomes **extend**, and durable persistence is pulled forward relative to greenfield plans.

| Phase | Focus | Primary paths | Exit criteria |
|-------|-------|---------------|---------------|
| **0** | Discovery (this audit) | `docs/acss/` | Docs reviewed; ADR evolve-in-place accepted |
| **1** | ACSS core contracts | `lib/ai/platform/types/`, thin `acss` adapters if needed | Typed Mission/Task/AgentResult/GovernanceDecision/AutonomyLevel mapping; unit tests |
| **2** | Agent Registry enrichment | `lib/ai/platform/agents/` | Manifests declare tools/permissions/autonomy; validation fails closed |
| **3** | Consent & Policy Governor | `lib/consent/`, `guardian/`, action policy | Composed decision; consent scopes enforced on consequential paths; adversarial tests |
| **4** | Model Gateway hardening | `models/gateway.ts`, registry | Sensitivity/cost routing; no direct provider SDKs in agents |
| **5** | Personal Navigator | `lib/ai/navigator/`, APIs, a11y UI | Mission interpretation entry; governance non-bypassable |
| **6** | Orchestration | `missions/`, orchestrator agent | Plan/route/delegate/synthesise; durable mission store started |
| **7** | Specialist agents | evidence/intake, support_participation, new policy agent | Docs / Support / Policy with provenance rules |
| **8** | Durable workflows | Prisma WorkflowRun, Temporal investigate, Cron | `WorkflowEngine` interface; no sole reliance on HTTP lifetime |
| **9** | Action Gateway | `actions/`, connector-gateway, approval UX | Propose → approve → execute; legacy high-risk paths inventoried |
| **10** | Audit / observability | `audit/`, telemetry correlation | End-to-end mission→tool→outcome trace |
| **11** | Advanced intelligence | embeddings, digital twin interfaces only | No unrestricted autonomy; scenario contracts only |

## Why this order

1. Contracts before agents — shared language with existing AuthorityCeiling.  
2. Consent/governor before Navigator expansion — human agency invariant.  
3. Model gateway before more model-backed specialists — single choke point.  
4. Durable stores before Cron/Queues expansion — Vercel isolate safety.  
5. Action Gateway last among core — requires consent + governor + approvals.

## MVP boundary

### BUILD NOW (after approval)

- ACSS contract adapters  
- Registry enrichment  
- Consent scope enforcement  
- Policy Governor composition + durable decisions  
- Navigator as governed mission entry (flagged)  
- Documentation Agent capabilities (from evidence + intake)  
- Support Coordination Agent (INFORM/RECOMMEND/PLAN only)  
- Policy Intelligence Agent (provenance-labelled)  
- Adversarial security tests  
- Durable mission/action persistence  

### BUILD LATER

- Live vector/semantic memory  
- Vercel Workflow / Queues adapters  
- Housing/Finance/Tech specialist depth  
- Digital Twin / ScenarioEngine implementation  
- Broad MCP-as-Action-Gateway  
- CareGPT conversational surface  

### DO NOT BUILD

- Unrestricted autonomous agents  
- Silent consequential decisions  
- Custom Kubernetes / unnecessary microservices  
- Second AI platform / second auth / second DB  
- Permanently running in-memory agents  
- Prompt-only “governance”  

## Architecture Decision (Phase 0)

**Evolve `lib/ai/platform` in place.** ACSS is the human-governed product doctrine and contract layer. `AutonomyLevel` adapts onto `AuthorityCeiling`; do not replace authority taxonomy without a dedicated ADR and migration.

## Testing each phase

- Unit: consent, autonomy, registry, governor decisions  
- Integration: multi-agent mission + approval  
- Security: bypass attempts fail closed  
- Regression: existing MapAble suites + production-claims  
- A11y: approval and navigator surfaces  

## CI/CD path (already suitable)

```text
feature branch → Vercel preview → CI (type/lint/test/security/claims) → human review → production (flags off → progressive)
```

## Stop condition

**No Phase 1 application code until explicit approval of this Phase 0 audit.**

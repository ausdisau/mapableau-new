# MapAble ACSS — File-by-File Migration Map

**Phase:** 0 — Forensic audit  
**Rule:** Actual repository paths only. Actions: KEEP | EXTEND | ADAPT | MIGRATE | REPLACE | DEPRECATE | UNKNOWN  
**Do not REPLACE without evidence.** Prefer EXTEND.

Migration order phases align with [10-IMPLEMENTATION-ROADMAP.md](./10-IMPLEMENTATION-ROADMAP.md).

---

## How to read entries

```text
CURRENT FILE
CURRENT RESPONSIBILITY → ACSS TARGET
ACTION | RISK | DEPENDENCIES | PHASE
```

---

## Root configuration

| File | Current | Target | Action | Risk | Deps | Phase |
|------|---------|--------|--------|------|------|-------|
| `package.json` | App manifest; Next 15.5; AI SDK; NextAuth; Prisma | Keep; add deps only with ADR | KEEP | Low | — | 0 |
| `pnpm-lock.yaml` | Canonical lockfile | Keep | KEEP | Low | pnpm | 0 |
| `package-lock.json` | Secondary lock (npm) | Do not dual-maintain; leave until cleanup ADR | DEPRECATE (later) | Low | — | 11+ |
| `pnpm-workspace.yaml` | Workspace roots | Keep | KEEP | Low | — | 0 |
| `vercel.json` | Cron + CORS | Extend crons when durable ACSS ticks exist | EXTEND | Med | Vercel | 8 |
| `next.config.ts` | Build, headers, redirects | Keep; security headers | KEEP | Low | Next | 0 |
| `middleware.ts` | JWT, CSP, hosts | Keep; zero-trust entry | KEEP / EXTEND | Med | NextAuth | 3 |
| `tsconfig.json` | TS paths | Keep | KEEP | Low | — | 0 |
| `.env.example` | Env catalogue | Document ACSS flags; fix `DOCUMENT_STORAGE_*` drift later | EXTEND | Low | — | 1+ |
| `instrumentation.ts` | Otel/hooks if any | Keep for observability | KEEP | Low | — | 10 |
| `README.md` | Amalgamation notes | Link `docs/acss/` when approved | EXTEND | Low | — | 0 |

**Absent:** `turbo.json`, `nx.json`, `yarn.lock`, `bun.lock`.

---

## AI Platform (canonical ACSS spine)

| File / dir | Current | Target | Action | Risk | Phase |
|------------|---------|--------|--------|------|-------|
| `lib/ai/platform/agents/manifests.ts` | 8 operational agents | ACSS registry SoT | EXTEND | Med | 2 |
| `lib/ai/platform/agents/types.ts` | Manifest + mission types | Add ACSS contract adapters | EXTEND | Med | 1–2 |
| `lib/ai/platform/agents/registry.ts` | Registry ops | Capability discovery | EXTEND | Low | 2 |
| `lib/ai/platform/agents/activation.ts` | Activation | Keep gated | KEEP | Low | 2 |
| `lib/ai/platform/agents/authority.ts` | Authority helpers | Map AutonomyLevel | EXTEND | Med | 1 |
| `lib/ai/platform/agents/validation.ts` | Manifest validation | Stricter tool/permission checks | EXTEND | Med | 2 |
| `lib/ai/platform/capabilities/**` | Capability registry | Keep single registry | KEEP / EXTEND | Med | 2 |
| `lib/ai/platform/models/gateway.ts` | Model Gateway | ACSS Model Gateway SoT | EXTEND | Med | 4 |
| `lib/ai/platform/models/registry.ts` | Allowlist | Sensitivity/cost metadata | EXTEND | Low | 4 |
| `lib/ai/platform/prompts/registry.ts` | Prompt governance | Keep | KEEP | Low | 1 |
| `lib/ai/platform/policies/kill-switches.ts` | Kills | Keep | KEEP | Low | 3 |
| `lib/ai/platform/policies/safeguarding-gate.ts` | Human escalation | Keep (not an agent) | KEEP | Med | 3 |
| `lib/ai/platform/guardian/**` | Privacy/purpose/zones | Policy Governor core | EXTEND | **High** | 3 |
| `lib/ai/platform/actions/**` | Governed Action Kernel | Action Gateway | EXTEND | **High** | 9 |
| `lib/ai/platform/actions/store.ts` | In-memory proposals | Durable SoR | ADAPT | **High** | 8–9 |
| `lib/ai/platform/missions/**` | Mission runtime | Orchestrator backbone | EXTEND | **High** | 6 |
| `lib/ai/platform/missions/store.ts` | In-memory Map | Durable missions | ADAPT | **High** | 6–8 |
| `lib/ai/platform/mission-watch/**` | Proactive watch | Background notice | EXTEND | Med | 8 |
| `lib/ai/platform/recovery/**` | Adaptive recovery | Reassess without auto-decide | KEEP / EXTEND | Med | 6 |
| `lib/ai/platform/context-fabric/**` | Provenance context | Memory/knowledge bridge | EXTEND | Med | 5–7 |
| `lib/ai/platform/retrieval/**` | Hybrid retrieval | Knowledge Service backend | EXTEND | Med | 7 |
| `lib/ai/platform/embeddings/types.ts` | Contracts only | Future semantic memory | KEEP | Low | 11 |
| `lib/ai/platform/connector-gateway/**` | External connectors | Action Gateway egress | EXTEND | **High** | 9 |
| `lib/ai/platform/intake/**` | Doc classify/extract | Documentation Agent capabilities | EXTEND | Med | 7 |
| `lib/ai/platform/human-review/**` | Review contracts | Approval primitive | EXTEND | Med | 3–9 |
| `lib/ai/platform/types/authority.ts` | AuthorityCeiling | Map ACSS AutonomyLevel | EXTEND | Med | 1 |
| `docs/ai-platform/**` | Platform docs | Cross-link ACSS; remain SoT for flags | KEEP | Low | 0 |

---

## Navigator

| File / dir | Current | Target | Action | Risk | Phase |
|------------|---------|--------|--------|------|-------|
| `lib/ai/navigator/orchestrator.ts` | Pilot orchestrator | Personal AI Navigator entry | EXTEND | **High** | 5 |
| `lib/ai/navigator/consent-gate.ts` | Consent gate | Wired to Consent Engine | EXTEND | **High** | 3–5 |
| `lib/ai/navigator/memory/**` | Pilot memory | Profile/working memory | EXTEND | Med | 5 |
| `lib/ai/navigator/passport/**` | Decision passport | Participant-facing explanations | EXTEND | Med | 5 |
| `lib/ai/navigator/matching/**` | Provider matching | Support discovery tool | KEEP / EXTEND | Med | 5–7 |
| `lib/ai/navigator/envelopes/**` | Draft envelopes | Proposed actions | EXTEND | Med | 5–9 |
| `lib/ai/navigator/escalation/**` | Escalation | Human path | KEEP | Low | 5 |
| `app/api/navigator/pilot/**` | Pilot APIs | Evolve to Navigator/Mission APIs | EXTEND | Med | 5 |
| `app/navigator/**` (pages) | UI surfaces | ACSS UX entry (later) | EXTEND | Med | 5+ |

---

## Consent, auth, audit

| File / dir | Current | Target | Action | Risk | Phase |
|------------|---------|--------|--------|------|-------|
| `lib/consent/**` | Consent services | Dynamic Consent Engine | EXTEND | **High** | 3 |
| `app/api/consent/**`, `app/api/consents/**` | Consent APIs | Consent API surface | EXTEND | Med | 3 |
| `lib/auth/**` | NextAuth helpers, RBAC | Keep SoT | KEEP | **High** if changed | — |
| `app/api/auth/[...nextauth]/**` | Auth routes | Keep | KEEP | **High** | — |
| `lib/audit/audit-event-service.ts` | Audit ledger | ACSS audit correlation | EXTEND | Med | 10 |
| `lib/auth/withAuthorization.ts` | API authz | Keep on all ACSS APIs | KEEP | **High** | 1+ |
| `lib/auth/guards.ts` | Page guards | Keep | KEEP | Med | — |
| `lib/auth/permissions.ts` | RBAC matrix | Possibly tool permissions later | EXTEND | Med | 3 |

---

## CareOS / intelligence (adapter, don’t fork)

| File / dir | Current | Target | Action | Risk | Phase |
|------------|---------|--------|--------|------|-------|
| `intelligence/agents/**` | CareOS agents | Compatibility / domain specialists via adapter | ADAPT | Med | 2–7 |
| `intelligence/orchestrator.ts` | `@openai/agents` run | Prefer platform orchestrator | ADAPT / DEPRECATE gradual | Med | 6 |
| `intelligence/network/**` | Mission graph, registry adapter | Bridge to platform | ADAPT | Med | 6 |
| `intelligence/memory/**` | Participant memory | Profile memory input | EXTEND | Med | 5 |
| `intelligence/consent/**` | Session consent | Align with `lib/consent` | ADAPT | Med | 3 |
| `intelligence/policies/**` | Prohibited uses, approval tokens | Feed Policy Governor | EXTEND | Med | 3 |
| `packages/intelligence-kernel/**` | Kernel package | Keep; don’t duplicate | KEEP | Low | — |

---

## Model / streaming / copilots

| File / dir | Current | Target | Action | Risk | Phase |
|------------|---------|--------|--------|------|-------|
| `lib/search/interpreter/**` | NL interpreter | Capability via gateway | KEEP | Low | 4 |
| `lib/provider/finder/conversation/**` | Streaming chat | Governed chat pattern | EXTEND | Med | 5 |
| `app/api/provider-finder/chat/route.ts` | Stream route | Example streaming ACSS UX | KEEP | Low | — |
| `lib/agent/disability-services-*.ts` | Experimental agents | Fold under registry or keep flagged | ADAPT | Med | 7 |
| `lib/agent/booking-services-*.ts` | Experimental | Same | ADAPT | Med | 7 |
| `lib/ai/mission-copilot/**` | Mission copilot | Orchestrator assist | EXTEND | Med | 6 |
| `lib/ai/case-copilot/**` | Case copilot | Specialist assist | KEEP | Low | 7 |
| `lib/understanding/**` | Understanding agent | Capability | KEEP | Low | 7 |
| `server/chat/**`, `server/replit_integrations/**` | Replit dual path | Do not expand for ACSS | DEPRECATE (long-term) | Med | 11 |

---

## Workflows, storage, data

| File / dir | Current | Target | Action | Risk | Phase |
|------------|---------|--------|--------|------|-------|
| `lib/workflows/temporal/**` | Temporal client/worker (pkgs missing) | WorkflowEngine adapter candidate | ADAPT / INVESTIGATE | **High** | 8 |
| `lib/platform/durable-workflow-service.ts` | Prisma WorkflowRun | Default durable path | EXTEND | Med | 8 |
| `lib/storage/document-storage-service.ts` | Backend selector | StorageAdapter | EXTEND | Med | 7–8 |
| `lib/storage/documents.ts` | Local FS | Production must not use local on Vercel | ADAPT | **High** | 8 |
| `lib/platform/secure-document-service.ts` | Scan + store | Document Agent input path | KEEP | Med | 7 |
| `lib/documents/**` | Domain docs | Evidence organisation | EXTEND | Med | 7 |
| `prisma/schema.prisma` | SoR | Extend for durable ACSS entities | EXTEND | **High** | 3–8 |
| `prisma/migrations/**` | History | New migrations only via CI | KEEP | **High** | — |
| `lib/prisma.ts` | Client | Keep | KEEP | Low | — |

---

## MCP

| File | Current | Target | Action | Risk | Phase |
|------|---------|--------|--------|------|-------|
| `mcp/av/server.ts` | AV MCP tools | Operator tooling; optional Action Gateway tools with hard auth | KEEP / EXTEND | **High** if exposed | 9+ |
| `mcp/careos/server.ts` | CareOS MCP | Same | KEEP | **High** if exposed | 9+ |
| `.cursor/mcp.json` | Cursor config | Dev only | KEEP | Low | — |

---

## APIs (selected ACSS-relevant)

| Path | Current | Target | Action | Phase |
|------|---------|--------|--------|-------|
| `app/api/ai/agents/**` | Agent admin/list | Agent API | EXTEND | 2 |
| `app/api/ai/missions/**` | Mission plan/runtime | Mission API | EXTEND | 6 |
| `app/api/ai/actions/**` | Action proposals | Action API | EXTEND | 9 |
| `app/api/ai/guardian/**` | Guardian evaluate | Governance API | EXTEND | 3 |
| `app/api/ai/context/**` | Context fabric | Memory/knowledge | EXTEND | 5 |
| `app/api/navigator/**` | Navigator pilot | Navigator API | EXTEND | 5 |
| `app/api/orchestration/**` | Domain orchestration | Keep; route via ACSS later | KEEP | 6 |
| `app/api/consent/**` | Consent | Consent API | EXTEND | 3 |
| `app/api/documents/**` | Documents | Evidence | KEEP | 7 |
| `app/api/admin/audit-events` | Audit | Audit API | EXTEND | 10 |
| `app/api/webhooks/**` | Webhooks | External ingress | KEEP | 9 |
| `app/api/chat/**` | Chat bots | Governed | ADAPT | 5+ |

Full API surface: ~758 `route.ts` files / 127 top-level `app/api` dirs — do not rename wholesale.

---

## UI / accessibility / assets

| Path | Current | Target | Action | Phase |
|------|---------|--------|--------|-------|
| `packages/accessibility/**` | A11y primitives | Mandatory for ACSS UI | KEEP | 5+ |
| `components/consent-wallet/**` | Consent UX | Consent Engine UI | EXTEND | 3 |
| `app/admin/ai-*/**` | AI admin | Governance ops | EXTEND | 2–10 |
| `public/brand/*.svg` | Logos | Brand | KEEP | — |
| `public/floor-plans/demo/*.svg` | Indoor demo plans | Access domain | KEEP | — |
| Other `*.svg` (repo ~14 excl node_modules) | Icons/assets | Keep; update architecture diagrams later if any in docs | KEEP | — |

---

## Tests & CI

| Path | Current | Target | Action | Phase |
|------|---------|--------|--------|-------|
| `tests/ai-platform/**` | Platform evals | Expand governance/adversarial | EXTEND | 1–10 |
| `tests/navigator/**` | Navigator | EXTEND | Med | 5 |
| `tests/security/**` | Security | Consent bypass / cross-tenant | EXTEND | 3 |
| `tests/a11y/**` | Accessibility | ACSS UI a11y | EXTEND | 5 |
| `.github/workflows/ci.yml` | Main CI | Preview + gates | KEEP | — |
| `.github/workflows/security.yml` etc. | Security | KEEP | — | — |
| `.github/workflows/production-claims.yml` | Claim honesty | KEEP for ACSS claims | KEEP | — |

---

## Apps / packages (non-core web)

| Path | Action | Notes |
|------|--------|-------|
| `apps/realtime-server` | KEEP (external) | Not serverless request path |
| `apps/companion`, `apps/independence` | KEEP | Independent Expo installs |
| `packages/domain-*` | KEEP | Domain SoT |
| `packages/ui` | KEEP | UI kit |
| `client/` | UNKNOWN / DEPRECATE later | Legacy Replit/Vite side — out of ACSS spine |
| `amalgamation/` | KEEP (staging) | Do not treat as runtime SoT |
| `infra/` | KEEP | Ops |

---

## Priority classification summary

| Action | Meaning in this map |
|--------|---------------------|
| KEEP | Reuse as-is for ACSS |
| EXTEND | Primary ACSS evolution path |
| ADAPT | Change shape/wiring without replacing product purpose |
| MIGRATE | Move responsibility (rare; prefer EXTEND) |
| REPLACE | **None recommended in Phase 0** without new evidence |
| DEPRECATE | Long-term wind-down (Replit chat dual path; duplicate lockfile) |

---

## First 10 concrete changes (ordered)

1. Publish ACSS doctrine docs (`docs/acss/*`) — this audit  
2. Add ACSS contract types adapting `AuthorityCeiling` ↔ `AutonomyLevel` under `lib/ai/platform/types/` (Phase 1)  
3. Extend agent manifests with explicit tool/permission/autonomy declarations (Phase 2)  
4. Wire consent scopes into guardian + action policy for consequential paths (Phase 3)  
5. Persist `GovernanceDecision` / promote guardian composition (Phase 3)  
6. Durable mission store replacing `missions/store.ts` Map (Phase 6/8)  
7. Durable action proposal/approval store (Phase 9)  
8. Promote Navigator as mission interpreter entry behind flags (Phase 5)  
9. Productise Documentation + Support Coordination specialists from existing agents (Phase 7)  
10. Add adversarial tests: consent bypass, autonomy exceed, cross-participant (Phase 3+)  

**STOP after Phase 0 docs until explicit approval.**

# MapAble ACSS — Target Directory Map

**Phase:** 0 — Forensic audit  
**Principle:** Prefer existing directories. New trees only when consolidation fails.

---

## Verdict

Do **not** create a top-level parallel `acss/` application runtime that forks AI Platform.  
Treat **ACSS as product doctrine + contract adapters** over:

```text
lib/ai/platform/     ← canonical spine
lib/ai/navigator/    ← Personal Navigator
lib/consent/         ← Consent Engine
lib/audit/           ← Audit Ledger
lib/auth/            ← Identity / RBAC
prisma/              ← System of Record
app/api/ai|navigator|consent|…  ← HTTP surfaces
docs/acss/           ← ACSS architecture docs (this folder)
```

---

## Mapping: current → ACSS domain

| Current directory | ACSS domain | Rationale |
|-------------------|-------------|-----------|
| `lib/ai/platform/agents/` | Agent Registry + contracts | Already canonical 8-agent registry |
| `lib/ai/platform/types/` | Core types / authority | Extend with ACSS adapters here |
| `lib/ai/platform/guardian/` | Policy Governor | Compose governors; don’t invent `lib/acss/governance` unless facade-only |
| `lib/ai/platform/actions/` | Action Gateway | Rename in docs; code path stays |
| `lib/ai/platform/missions/` | Orchestrator | Mission planner/router/executor |
| `lib/ai/platform/models/` | Model Gateway | Keep |
| `lib/ai/platform/context-fabric/` + `retrieval/` | Knowledge + context | Keep |
| `lib/ai/platform/embeddings/` | Future semantic memory | Contracts only |
| `lib/ai/navigator/` | Personal Navigator | Promote |
| `lib/consent/` | Consent Engine | Extend |
| `lib/audit/` | Audit | Extend correlation |
| `lib/storage/` + `lib/documents/` | Document memory / evidence | Keep adapters |
| `lib/workflows/temporal/` + `lib/platform/durable-workflow-service.ts` | WorkflowEngine adapters | Portable interface nearby |
| `intelligence/**` | Legacy CareOS network | Adapter only |
| `mcp/` | Operator MCP tools | External to request path |
| `app/api/ai/**` | ACSS / Agent / Mission / Governance / Action APIs | Extend in place |
| `app/api/navigator/**` | Navigator API | Extend |
| `app/api/consent/**` | Consent API | Extend |
| `packages/accessibility/` | A11y primitives | Mandatory reuse |
| `docs/ai-platform/` | Platform runbooks / flags | Remain authoritative for enablement |
| `docs/acss/` | ACSS audit + roadmap | Phase 0+ doctrine |

---

## Optional thin facade (only if needed in Phase 1)

If engineers need a single import path for ACSS names without scattering adapters:

```text
lib/ai/platform/acss/
  ├── index.ts          # re-exports
  ├── autonomy.ts       # AutonomyLevel ↔ AuthorityCeiling
  ├── governance.ts     # GovernanceDecision facade types
  └── contracts.ts      # Mission/Task/AgentResult aliases
```

**Rationale:** Lives *inside* the existing platform module — not a new top-level `acss/` package.  
**Do not create** if re-exports add confusion; prefer extending `types/authority.ts` directly.

---

## Directories NOT recommended

| Proposed blind structure | Why not |
|--------------------------|---------|
| Top-level `acss/core|agents|orchestration|…` | Duplicates `lib/ai/platform` |
| New microservice apps for each agent | Conflicts with Vercel/Next monolith + flags |
| New vector DB app | Premature; embeddings contracts only |
| Parallel Prisma schema package | SoR is `prisma/schema.prisma` |

---

## Frontend placement (later phases)

| UX | Suggested home |
|----|----------------|
| Navigator chat / mission UI | `app/navigator/`, `app/my/` (existing My MapAble mission surfaces) |
| Approval cards | Mission View / Action Review (already sketched in AI platform) |
| Consent wallet | Existing consent wallet components |
| Admin agent/gov | `app/admin/ai-*` |

No UI redesign in Phase 0.

---

## SVG / visual assets

| File | Purpose | ACSS relevance |
|------|---------|----------------|
| `public/brand/mapable-logo.svg` | Brand | KEEP |
| `public/brand/mapable-logo-mark.svg` | Mark | KEEP |
| `public/floor-plans/demo/parramatta-*.svg` | Indoor access demos | KEEP (access domain) |

Few SVGs in repo (~4 in `public/`). No ACSS architecture SVG found — optional future diagram under `docs/acss/` assets only if needed; do not modify brand SVGs.

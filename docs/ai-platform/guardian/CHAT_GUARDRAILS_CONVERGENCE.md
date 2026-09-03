# Chat Guardrails → Unified Guardian Convergence

## Current state (evidence)

| Path | Role |
|------|------|
| `server/chat-guardrails.ts` / `scripts/server/chat-guardrails.ts` | Replit twin — quarantined (`docs/operations/LEGACY_REPLIT_TWIN.md`) |
| Drizzle tables (`safeguarding_*`, `chat_guardrail_audit_logs`) | Twin SoR — **not** production Prisma incident/complaint SoR |
| `lib/chat/guardrails/` | Classifier port — **not** wired by root `app/` routes |
| `lib/copilot/guardrails.ts` | Orthogonal ask/copilot action filter — keep |
| Production incidents/complaints | Prisma + `lib/incidents/` + engagement APIs |

## Decision

1. **Reuse** classifier patterns as future Guardian signal inputs.  
2. **Do not** treat Drizzle safeguarding drafts as canonical SoR.  
3. Preferred path: chat input → Unified Guardian → canonical complaint/incident/consent services.  
4. Compatibility layer (later PR) should call Guardian contracts, not maintain independent policy.  
5. **No destructive table removal** in Phase 0–2.

## Deprecation plan

| Step | Status |
|------|--------|
| Document twin as compatibility-only | Done (this doc) |
| Guardian deterministic policy live (flags off) | Phase 1–2 |
| Adapter: classify → Guardian → intake payload | Phase 4 |
| Stop new writes to Drizzle safeguarding tables | After adapter + migration approval |
| Drop twin tables | Separate approved PR only |

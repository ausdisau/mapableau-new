# MapAble AI Security

> Governance, gateway architecture, and hardening requirements for AI capabilities.

---

## 1. Current Architecture

```
HTTP Request
    │
    ▼
app/api/ai/* | /api/agent/* | /api/intelligence/*
    │
    ▼
lib/ai/platform/
    ├── capabilities/registry.ts   (feature registration)
    ├── policies/kill-switches.ts  (global + per-capability)
    ├── models/gateway.ts          (resolveModelForCapability)
    ├── action-kernel/             (human approval required)
    ├── connector-gateway/         (external credentials)
    └── context-fabric/            (event envelope)
    │
    ▼
Domain handlers (lib/ai/*, intelligence/*) ──▶ Prisma ──▶ PostgreSQL
```

**Problem:** Many handlers reach **Prisma directly**, bypassing a unified permission boundary.

---

## 2. Target Architecture (Phase 5)

```
AI Route / Agent Tool
    │
    ▼
packages/ai-gateway/
    ├── assertAuthenticatedUser()
    ├── assertCapabilityPermission()
    ├── assertParticipantAuthority()  (when scoped)
    └── auditAiAction()
    │
    ▼
Domain Service (existing lib/*)
    │
    ▼
Prisma
```

**Rules:**

1. AI MUST NOT import `lib/prisma` directly from agent tools
2. AI MUST NOT read `process.env` for secrets at tool runtime
3. Every mutating AI action requires audit entry
4. Kill switches checked before model invocation

---

## 3. Existing Controls

| Control | Location |
|---------|----------|
| Global kill switch | `MAPABLE_AI_GLOBAL_KILL_SWITCH` |
| Per-capability kills | `lib/ai/platform/policies/kill-switches.ts` |
| Model allowlist | `lib/ai/platform/models/registry.ts` |
| Human review states | `lib/ai/platform/human-review/contracts.ts` |
| Action kernel approval | `isProposalApproved()` before execute |
| Sensitive redaction | `lib/ai/platform/redaction/sensitive.ts` |
| Telemetry | `lib/ai/platform/telemetry/adapter.ts` → PostHog |
| ARC sidecar assessments | Capability maturity tiers |

---

## 4. Capability Flags (fail-closed)

Default in `.env.example`: `MAPABLE_AI_ENABLED=false`, most sub-capabilities `false`.

**Exception:** `SEARCH_INTERPRETER_ENABLED=true` by default — review before production keys are present.

---

## 5. High-Risk Entry Points

| Route | Risk | Controls |
|-------|------|----------|
| `/api/mapable/ask` | Unified copilot | Guardrails, multi-agent routing |
| `/api/provider-finder/chat` | Streaming LLM | `assertProviderFinderChatAllowed` |
| `/api/ai/actions/proposals/*/execute` | Autonomous action | Approval binding |
| `/api/intelligence/careos-actions/execute` | Care mutations | Flags + session |
| `/api/agent/disability-services` | ToolLoopAgent | Rate limit; auth gap |
| MCP `mcp/careos/server.ts` | Local tooling | Not HTTP-exposed |

---

## 6. Prompt Injection Mitigations

| Layer | Measure |
|-------|---------|
| Input | `guardStructuredInput()` on structured payloads |
| Tools | Allowlisted tools only; no arbitrary SQL tool |
| Output | Redaction before persistence |
| Elevation | Action kernel requires human approval |
| Monitoring | PostHog LLM events (must not log PII — see PRIVACY_REVIEW) |

---

## 7. Connector Gateway

External credentials materialised at runtime with redaction in tests (`tests/ai-platform/connector-gateway-credentials.test.ts`).

Per-connector kill switches: `MAPABLE_CONNECTOR_*_KILL_SWITCH`.

---

## 8. Implementation Plan

| Step | Deliverable |
|------|-------------|
| 1 | Create `packages/ai-gateway` with permission + audit facade |
| 2 | Migrate `/api/ai/actions/*` to gateway |
| 3 | Migrate agent tools to domain services only |
| 4 | Add integration tests: unauthenticated → 401, wrong participant → 403 |
| 5 | Block direct Prisma imports in `lib/agent/**` via ESLint boundary rule |

---

## 9. Audit Requirements

Every AI mutation logs:

- `actorUserId`, `capabilityId`, `modelId`
- Input hash (not raw prompt if contains PII)
- Outcome (success/denied/killed)
- `requestId` correlation

Use `createAuditEvent` + `captureAiPlatformTelemetry` with redaction.

---

## 10. Emergency Procedures

1. Set `MAPABLE_AI_GLOBAL_KILL_SWITCH=true`
2. Set capability-specific kill switches
3. Disable `SEARCH_INTERPRETER_ENABLED` and agent flags
4. Revoke `AI_GATEWAY_API_KEY` at provider if key compromise suspected

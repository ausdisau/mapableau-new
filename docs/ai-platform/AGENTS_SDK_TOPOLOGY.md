# Agents SDK topology (internal / controlled pilot)

**Status:** internal_alpha · **not_claimable** · flags default **false**

This document describes the governed OpenAI Agents SDK adapter under `lib/ai/platform/agents-sdk/`. It is not a new agent operating system, consent store, or audit model.

## Topology

- **Root agent:** MapAble Participant Navigator Manager — owns the final reply; specialists are consulted via `agent.asTool()` (no handoffs).
- **Specialists:** Access (live for governed Navigator provider search), Care/Transport/Jobs (fail-closed contracts), Safeguarding (draft/human-review), Compliance (read/draft only).

## Governance

Every tool call passes through `policy.ts` before canonical services:

1. Actor / tenant / participant context
2. Registered capability + feature flag (`MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED`)
3. Kill switches
4. Capability + context tool allowlist intersection
5. Permanent prohibition list
6. Purpose-specific consent (`ConsentRecord` SoT)
7. Deterministic service execution
8. `AuditEvent` / `AgentRun` evidence

SDK `needsApproval` pauses are preliminary only. Business authority remains with envelopes, consent, and human review.

## State

Serializable `MapAbleAgentRunContext` only — no secrets, Prisma clients, or raw health documents.

Paused runs: encrypted `RunState` stored server-side in `GovernedActionEnvelope` action `agents_sdk_run_pause`; UI receives opaque envelope id only.

## Tracing

`traceIncludeSensitiveData: false`. Trace metadata: capability key, purpose, domain set — no participant/tenant IDs or free text.

## MCP

Stdio MCP (`mcp:av`, `mcp:careos`) is opt-in via `MAPABLE_AGENTS_SDK_MCP_LOCAL=true` for local dev/evals. Never spawned from Vercel handlers. Tools filtered to allowlist.

## Non-goals

No booking, payment, assignment, clinical decisions, safeguarding findings, regulatory submissions, or model-broadened authority.

## Rollback

Set `MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED=false` (default). Remove call sites to `runManagerTurn` if introduced behind flags.

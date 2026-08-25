# AI Control Plane (Prompt 11)

Reliability, observability, and cost control for the Agentic Nerve Centre —
**system health only**. This plane does **not** score participants, build
behavioural profiles, or expand operational authority.

**Flag (default off):** `MAPABLE_AI_CONTROL_PLANE_ENABLED=false`

Optional cheaper/local fallback route (also fail-closed):
`MAPABLE_AI_CONTROL_PLANE_CHEAPER_FALLBACK_ENABLED=false`

## Position in the stack

```
Missions / Agents / Capabilities / Context / Actions / Recovery / Connectors / Evals
                                      │
                                      ▼
              lib/ai/platform/control-plane/  (this module)
                                      │
              reuses telemetry/adapter + redaction/sensitive
              + lib/platform/observability redaction
```

Do **not** create a parallel surveillance telemetry path. Prefer
`captureAiPlatformTelemetry` and `redactSensitiveText` /
`redactSensitiveContent`.

## Modules

| File | Role |
|------|------|
| `types.ts` | Subsystems, traces, budgets, circuits, alerts, dashboard shapes |
| `slo.ts` | SLO *candidates* with configurable targets (null until set) |
| `tracing.ts` | Trace/span IDs across mission → recovery lifecycle |
| `budgets.ts` | Per-capability / per-mission token + call budgets |
| `circuit-breakers.ts` | Provider, connector, error, latency, kill, cost breakers |
| `metrics.ts` | In-memory counters (no participant scoring metrics) |
| `alerts.ts` | Operational alerts (never participant rejection) |
| `redaction.ts` | Sanitize details; reuse existing redactors |
| `dashboard.ts` | Internal ops snapshot |
| `index.ts` | Public API + `observeControlPlaneEvent` |

## SLOs

Candidates cover Mission Runtime, Action Kernel, Context Fabric, Recovery Engine,
and Connector Gateway: availability, latency, failed mission planning, blocked
action rate, connector degradation, human-review backlog.

**Targets stay `null` until operators configure evidence-based values** via
`configureSloTarget`. No invented production SLOs.

## Tracing

`startTraceSpan` / `endTraceSpan` propagate `traceId` across:

mission → agent activation → capability → context read → proposal → approval →
execution → connector → recovery

Only reason codes and aggregates are recorded — never raw participant content.

## Cost control

- Per-capability and per-mission token budgets + max model calls
- Budget exhaustion → `deterministic` (or optional `cheaper_route`) fallback
- Kill switch → `manual` fallback
- Open model-provider circuit → deterministic fallback

## Circuit breakers

`model_provider`, `connector`, `high_error_rate`, `latency_threshold`,
`kill_switch`, `cost_threshold` — in-memory state with open → half-open → closed
recovery. Syncs with existing global / action-kernel / recovery kill switches.

## Alerts (fire)

- Action execution failures, replay attempts
- Tenant-boundary failures
- Connector outage
- High human-review backlog
- Eval regression
- Kill switch activation / circuit open / budget exhaustion

## Alerts (must not fire)

- Participant rejects a recommendation
- Participant behavioural / compliance scoring (prohibited kinds)

## Dashboard

Admin surface: `/admin/ai/control-plane` (requires admin + flag).

Shows system health, failure reason codes, connector health, queue depth,
model spend aggregates, eval state, feature flags, kill switches. Privacy note
is always included. No participant free text.

## Persistence

In-memory metrics / circuits / alerts / traces only. **No Prisma migration** in
this prompt. Durable ops store → Prompt 11A if required.

## Privacy review

| Check | Status |
|-------|--------|
| Participant behavioural scoring | Prohibited |
| Raw sensitive plaintext logs | Redacted via existing helpers |
| Production telemetry secrets in code | None |
| Unbounded model spend | Budgets + circuits |
| Access expansion for observability | None (admin + existing flags) |

## Authority

**AUTHORITY CHANGES: NONE.** Control plane observes and gates spend/health; it
does not raise agent authority ceilings or auto-execute actions.

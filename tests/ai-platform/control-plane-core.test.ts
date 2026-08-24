import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  authorizeModelSpend,
  buildControlPlaneDashboard,
  closeCircuit,
  configureCircuitBreaker,
  configureTokenBudget,
  containsProhibitedParticipantContent,
  createControlPlaneTraceId,
  emitControlPlaneAlert,
  endTraceSpan,
  getCircuitState,
  getTraceChain,
  isProhibitedAlertKind,
  listRegisteredMetricNames,
  metricsContainProhibitedContent,
  observeControlPlaneEvent,
  openCircuit,
  propagateTraceFields,
  recordCircuitFailure,
  recordCircuitSuccess,
  recordModelSpend,
  redactControlPlaneText,
  resetControlPlaneState,
  sanitizeControlPlaneDetail,
  startTraceSpan,
} from "@/lib/ai/platform/control-plane";

describe("AI control plane", () => {
  beforeEach(() => {
    resetControlPlaneState();
    process.env.MAPABLE_AI_CONTROL_PLANE_ENABLED = "true";
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
    delete process.env.MAPABLE_AI_CONTROL_PLANE_CHEAPER_FALLBACK_ENABLED;
  });

  afterEach(() => {
    resetControlPlaneState();
    delete process.env.MAPABLE_AI_CONTROL_PLANE_ENABLED;
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
    delete process.env.MAPABLE_AI_CONTROL_PLANE_CHEAPER_FALLBACK_ENABLED;
  });

  it("propagates trace IDs across mission → recovery spans", () => {
    const traceId = createControlPlaneTraceId();
    const mission = startTraceSpan({
      traceId,
      missionId: "m-1",
      kind: "mission",
      subsystem: "mission_runtime",
    });
    const agent = startTraceSpan({
      ...propagateTraceFields({
        traceId,
        parentSpanId: mission.spanId,
        missionId: "m-1",
      }),
      kind: "agent_activation",
      subsystem: "agents",
      agentId: "mission_orchestrator",
    });
    const capability = startTraceSpan({
      traceId,
      missionId: "m-1",
      parentSpanId: agent.spanId,
      kind: "capability",
      subsystem: "capabilities",
      capabilityKey: "mission.runtime",
    });
    const context = startTraceSpan({
      traceId,
      missionId: "m-1",
      parentSpanId: capability.spanId,
      kind: "context_read",
      subsystem: "context_fabric",
    });
    const proposal = startTraceSpan({
      traceId,
      missionId: "m-1",
      parentSpanId: context.spanId,
      kind: "proposal",
      subsystem: "action_kernel",
    });
    const approval = startTraceSpan({
      traceId,
      missionId: "m-1",
      parentSpanId: proposal.spanId,
      kind: "approval",
      subsystem: "human_review",
    });
    const execution = startTraceSpan({
      traceId,
      missionId: "m-1",
      parentSpanId: approval.spanId,
      kind: "execution",
      subsystem: "action_kernel",
    });
    const connector = startTraceSpan({
      traceId,
      missionId: "m-1",
      parentSpanId: execution.spanId,
      kind: "connector",
      subsystem: "connector_gateway",
      connectorKey: "email_sendgrid",
    });
    const recovery = startTraceSpan({
      traceId,
      missionId: "m-1",
      parentSpanId: connector.spanId,
      kind: "recovery",
      subsystem: "recovery_engine",
    });

    for (const span of [
      mission,
      agent,
      capability,
      context,
      proposal,
      approval,
      execution,
      connector,
      recovery,
    ]) {
      endTraceSpan(span.spanId, { success: true, reasonCode: "ok" });
    }

    const chain = getTraceChain(traceId);
    expect(chain).toHaveLength(9);
    expect(chain.every((s) => s.traceId === traceId)).toBe(true);
    expect(chain.map((s) => s.kind)).toEqual([
      "mission",
      "agent_activation",
      "capability",
      "context_read",
      "proposal",
      "approval",
      "execution",
      "connector",
      "recovery",
    ]);
  });

  it("redacts participant content and secrets from control-plane details", () => {
    const redacted = redactControlPlaneText(
      "card 4111-1111-1111-1111 password=secret sk_live_abcdefghijklmnop",
    );
    expect(redacted).not.toMatch(/4111/);
    expect(redacted).not.toMatch(/secret/);
    expect(redacted).toContain("[REDACTED]");

    const sanitized = sanitizeControlPlaneDetail({
      objective:
        "Please book wheelchair transport to my interview at 9am tomorrow",
      reasonCode: "policy_blocked",
      count: 2,
    });
    expect(sanitized.objective).toBe("[REDACTED_PARTICIPANT_CONTENT]");
    expect(sanitized.reasonCode).toBe("policy_blocked");
    expect(sanitized.count).toBe(2);
  });

  it("exhausts token budget and falls back to deterministic behaviour", () => {
    configureTokenBudget({
      scope: "capability",
      scopeId: "search.nl_interpreter",
      maxTokens: 100,
      maxModelCalls: 10,
    });
    recordModelSpend({
      capabilityKey: "search.nl_interpreter",
      missionId: "m-1",
      tokens: 90,
    });
    const decision = authorizeModelSpend({
      capabilityKey: "search.nl_interpreter",
      missionId: "m-1",
      estimatedTokens: 20,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("token_budget_exhausted");
      expect(decision.fallback).toBe("deterministic");
    }
  });

  it("blocks model spend on model provider outage via circuit", () => {
    openCircuit("model_provider", "default", "provider_unavailable");
    configureTokenBudget({
      scope: "capability",
      scopeId: "search.nl_interpreter",
      maxTokens: 10_000,
      maxModelCalls: 100,
    });
    const decision = authorizeModelSpend({
      capabilityKey: "search.nl_interpreter",
      estimatedTokens: 10,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("circuit_open");
      expect(decision.fallback).toBe("deterministic");
    }
  });

  it("opens connector circuit on repeated outages and recovers", () => {
    configureCircuitBreaker("connector", "maps_geocode", {
      failureThreshold: 2,
      successThreshold: 2,
      openMs: 10,
    });
    recordCircuitFailure("connector", "maps_geocode", "timeout");
    recordCircuitFailure("connector", "maps_geocode", "timeout");
    expect(getCircuitState("connector", "maps_geocode")?.state).toBe("open");

    // Force half-open by closing then re-opening recovery path via manual close + success.
    closeCircuit("connector", "maps_geocode");
    expect(getCircuitState("connector", "maps_geocode")?.state).toBe("closed");

    openCircuit("connector", "maps_geocode", "forced");
    // Simulate recovery: manually move to half-open by closing then recording successes
    // after configure with immediate half-open window.
    configureCircuitBreaker("connector", "maps_geocode", {
      failureThreshold: 2,
      successThreshold: 1,
      openMs: 0,
    });
    openCircuit("connector", "maps_geocode", "outage");
    // openMs 0 → half_open on next read
    expect(getCircuitState("connector", "maps_geocode")?.state).toBe("half_open");
    recordCircuitSuccess("connector", "maps_geocode");
    expect(getCircuitState("connector", "maps_geocode")?.state).toBe("closed");
  });

  it("kill switch forces manual fallback", () => {
    process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH = "true";
    const decision = authorizeModelSpend({
      capabilityKey: "search.nl_interpreter",
      estimatedTokens: 5,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("kill_switch");
      expect(decision.fallback).toBe("manual");
    }
  });

  it("does not alert on participant rejection reason codes", () => {
    const alert = emitControlPlaneAlert({
      kind: "action_execution_failure",
      severity: "warning",
      subsystem: "action_kernel",
      reasonCode: "participant_rejected",
      detail: {},
    });
    expect(alert).toBeNull();
    expect(isProhibitedAlertKind("participant_rejection")).toBe(true);
  });

  it("metrics and dashboard contain no prohibited participant content", () => {
    observeControlPlaneEvent({
      kind: "mission_planned",
      reasonCode: "ok",
    });
    observeControlPlaneEvent({
      kind: "action_failed",
      reasonCode: "adapter_error",
      traceId: "t-1",
    });
    observeControlPlaneEvent({
      kind: "connector_failed",
      connectorKey: "email_sendgrid",
      reasonCode: "upstream_5xx",
    });
    observeControlPlaneEvent({ kind: "human_review_enqueued" });

    expect(metricsContainProhibitedContent()).toBe(false);
    expect(
      containsProhibitedParticipantContent(listRegisteredMetricNames()),
    ).toBe(false);

    const dash = buildControlPlaneDashboard();
    expect(dash.privacyNote.toLowerCase()).toContain("no participant");
    expect(containsProhibitedParticipantContent(dash)).toBe(false);
    expect(JSON.stringify(dash)).not.toMatch(/participant_score/i);
    expect(JSON.stringify(dash)).not.toMatch(/behaviour_score/i);
  });

  it("supports manual/deterministic fallback observation path", () => {
    process.env.MAPABLE_AI_CONTROL_PLANE_CHEAPER_FALLBACK_ENABLED = "true";
    configureTokenBudget({
      scope: "mission",
      scopeId: "m-budget",
      maxTokens: 10,
      maxModelCalls: 1,
    });
    recordModelSpend({
      capabilityKey: "search.nl_interpreter",
      missionId: "m-budget",
      tokens: 10,
    });
    // Need a mission-scoped budget check — configure capability too
    configureTokenBudget({
      scope: "capability",
      scopeId: "search.nl_interpreter",
      maxTokens: 10_000,
      maxModelCalls: 100,
    });
    const decision = authorizeModelSpend({
      capabilityKey: "search.nl_interpreter",
      missionId: "m-budget",
      estimatedTokens: 1,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.fallback).toBe("cheaper_route");
    }
  });
});

import {
  alertActionExecutionFailure,
  alertConnectorOutage,
  alertEvalRegression,
  alertHumanReviewBacklog,
  alertReplayAttempt,
  alertTenantBoundaryFailure,
  clearControlPlaneAlerts,
  emitControlPlaneAlert,
  isProhibitedAlertKind,
  listControlPlaneAlerts,
} from "./alerts";
import {
  authorizeModelSpend,
  clearBudgets,
  configureTokenBudget,
  getTokenBudget,
  listBudgets,
  recordModelSpend,
} from "./budgets";
import {
  clearCircuitBreakers,
  closeCircuit,
  configureCircuitBreaker,
  getCircuitState,
  isCircuitAllowingTraffic,
  listCircuitBreakers,
  listOpenCircuits,
  openCircuit,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "./circuit-breakers";
import {
  buildControlPlaneDashboard,
  dashboardBudgetSummary,
} from "./dashboard";
import {
  clearMetrics,
  getFailureReasonCounts,
  getMetric,
  humanReviewBacklog,
  incrementMetric,
  listRegisteredMetricNames,
  metricsContainProhibitedContent,
  recordFailureReason,
  recordLatencySample,
  snapshotMetrics,
} from "./metrics";
import {
  assertNoProhibitedParticipantMetrics,
  containsProhibitedParticipantContent,
  redactControlPlaneText,
  sanitizeControlPlaneDetail,
} from "./redaction";
import {
  clearSloTargets,
  configureSloTarget,
  evaluateSloCandidate,
  listSloCandidates,
} from "./slo";
import {
  clearTraceStore,
  createControlPlaneTraceId,
  createSpanId,
  endTraceSpan,
  getTraceChain,
  listRecentSpans,
  propagateTraceFields,
  startTraceSpan,
} from "./tracing";
import type {
  BudgetDecision,
  CircuitBreakerStatus,
  ControlPlaneAlert,
  ControlPlaneDashboard,
  ControlPlaneTraceContext,
  SloCandidate,
  TokenBudget,
} from "./types";
import {
  CONTROL_PLANE_SUBSYSTEMS,
  PROHIBITED_ALERT_KINDS,
  TRACE_SPAN_KINDS,
} from "./types";

export {
  CONTROL_PLANE_SUBSYSTEMS,
  PROHIBITED_ALERT_KINDS,
  TRACE_SPAN_KINDS,
  alertActionExecutionFailure,
  alertConnectorOutage,
  alertEvalRegression,
  alertHumanReviewBacklog,
  alertReplayAttempt,
  alertTenantBoundaryFailure,
  assertNoProhibitedParticipantMetrics,
  authorizeModelSpend,
  buildControlPlaneDashboard,
  clearBudgets,
  clearCircuitBreakers,
  clearControlPlaneAlerts,
  clearMetrics,
  clearSloTargets,
  clearTraceStore,
  closeCircuit,
  configureCircuitBreaker,
  configureSloTarget,
  configureTokenBudget,
  containsProhibitedParticipantContent,
  createControlPlaneTraceId,
  createSpanId,
  dashboardBudgetSummary,
  emitControlPlaneAlert,
  endTraceSpan,
  evaluateSloCandidate,
  getCircuitState,
  getFailureReasonCounts,
  getMetric,
  getTokenBudget,
  getTraceChain,
  humanReviewBacklog,
  incrementMetric,
  isCircuitAllowingTraffic,
  isProhibitedAlertKind,
  listBudgets,
  listCircuitBreakers,
  listControlPlaneAlerts,
  listOpenCircuits,
  listRecentSpans,
  listRegisteredMetricNames,
  listSloCandidates,
  metricsContainProhibitedContent,
  openCircuit,
  propagateTraceFields,
  recordCircuitFailure,
  recordCircuitSuccess,
  recordFailureReason,
  recordLatencySample,
  recordModelSpend,
  redactControlPlaneText,
  sanitizeControlPlaneDetail,
  snapshotMetrics,
  startTraceSpan,
};

export type {
  BudgetDecision,
  CircuitBreakerStatus,
  ControlPlaneAlert,
  ControlPlaneDashboard,
  ControlPlaneTraceContext,
  SloCandidate,
  TokenBudget,
};

/** Reset all in-memory control-plane state (tests / local ops). */
export function resetControlPlaneState(): void {
  clearMetrics();
  clearBudgets();
  clearCircuitBreakers();
  clearControlPlaneAlerts();
  clearTraceStore();
  clearSloTargets();
}

/**
 * High-level observation API for nerve-centre subsystems.
 * Records aggregates + optional alerts. Never accepts participant free text
 * as a required field — callers must pass reason codes only.
 */
export function observeControlPlaneEvent(input: {
  kind:
    | "mission_planned"
    | "mission_planning_failed"
    | "action_blocked"
    | "action_executed"
    | "action_failed"
    | "action_replayed"
    | "context_read"
    | "recovery_started"
    | "connector_ok"
    | "connector_degraded"
    | "connector_failed"
    | "model_blocked"
    | "human_review_enqueued"
    | "human_review_resolved"
    | "tenant_boundary_failure"
    | "eval_pass"
    | "eval_fail";
  reasonCode?: string;
  traceId?: string;
  latencyMs?: number;
  connectorKey?: string;
  capabilityKey?: string;
}): void {
  switch (input.kind) {
    case "mission_planned":
      incrementMetric("missions_planned");
      break;
    case "mission_planning_failed":
      incrementMetric("missions_failed_planning");
      if (input.reasonCode) recordFailureReason(input.reasonCode);
      break;
    case "action_blocked":
      incrementMetric("actions_blocked");
      if (input.reasonCode) recordFailureReason(input.reasonCode);
      break;
    case "action_executed":
      incrementMetric("actions_executed");
      break;
    case "action_failed":
      incrementMetric("actions_failed");
      alertActionExecutionFailure({
        reasonCode: input.reasonCode ?? "action_execution_failed",
        traceId: input.traceId,
      });
      break;
    case "action_replayed":
      incrementMetric("actions_replayed");
      alertReplayAttempt({
        reasonCode: input.reasonCode ?? "replay_attempt",
        traceId: input.traceId,
      });
      break;
    case "context_read":
      incrementMetric("context_reads");
      break;
    case "recovery_started":
      incrementMetric("recoveries_started");
      break;
    case "connector_ok":
      incrementMetric("connector_calls");
      if (input.connectorKey) {
        recordCircuitSuccess("connector", input.connectorKey);
      }
      break;
    case "connector_degraded":
      incrementMetric("connector_calls");
      incrementMetric("connector_degraded");
      if (input.connectorKey) {
        recordCircuitFailure(
          "connector",
          input.connectorKey,
          input.reasonCode ?? "connector_degraded",
          input.latencyMs,
        );
      }
      break;
    case "connector_failed":
      incrementMetric("connector_calls");
      incrementMetric("connector_failed");
      if (input.connectorKey) {
        recordCircuitFailure(
          "connector",
          input.connectorKey,
          input.reasonCode ?? "connector_failed",
          input.latencyMs,
        );
        alertConnectorOutage({
          connectorKey: input.connectorKey,
          reasonCode: input.reasonCode ?? "connector_outage",
          traceId: input.traceId,
        });
      }
      break;
    case "model_blocked":
      incrementMetric("model_blocked");
      break;
    case "human_review_enqueued":
      incrementMetric("human_review_enqueued");
      alertHumanReviewBacklog({
        backlog: humanReviewBacklog(),
        threshold: 25,
      });
      break;
    case "human_review_resolved":
      incrementMetric("human_review_resolved");
      break;
    case "tenant_boundary_failure":
      incrementMetric("tenant_boundary_failures");
      alertTenantBoundaryFailure({
        reasonCode: input.reasonCode ?? "tenant_boundary_failure",
        traceId: input.traceId,
      });
      break;
    case "eval_pass":
      incrementMetric("eval_pass");
      break;
    case "eval_fail":
      incrementMetric("eval_fail");
      alertEvalRegression({
        reasonCode: input.reasonCode ?? "eval_regression",
      });
      break;
    default: {
      const _exhaustive: never = input.kind;
      return _exhaustive;
    }
  }

  if (input.latencyMs !== undefined) {
    recordLatencySample(input.latencyMs);
  }
}

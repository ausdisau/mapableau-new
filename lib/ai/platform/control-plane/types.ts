/**
 * Control plane types — system health only.
 * Never score participants or store behavioural profiles.
 */

export const CONTROL_PLANE_SUBSYSTEMS = [
  "mission_runtime",
  "action_kernel",
  "context_fabric",
  "recovery_engine",
  "connector_gateway",
  "model_gateway",
  "human_review",
  "evaluations",
  "agents",
  "capabilities",
] as const;

export type ControlPlaneSubsystem = (typeof CONTROL_PLANE_SUBSYSTEMS)[number];

export const TRACE_SPAN_KINDS = [
  "mission",
  "agent_activation",
  "capability",
  "context_read",
  "proposal",
  "approval",
  "execution",
  "connector",
  "recovery",
  "model_call",
  "eval",
  "human_review",
] as const;

export type TraceSpanKind = (typeof TRACE_SPAN_KINDS)[number];

export type ControlPlaneTraceContext = {
  traceId: string;
  missionId?: string;
  spanId: string;
  parentSpanId?: string;
  kind: TraceSpanKind;
  subsystem: ControlPlaneSubsystem;
  capabilityKey?: string;
  connectorKey?: string;
  agentId?: string;
  startedAt: string;
  endedAt?: string;
  success?: boolean;
  /** Machine-readable reason codes only — never raw participant content. */
  reasonCode?: string;
  latencyMs?: number;
};

export type SloMetricId =
  | "availability"
  | "latency_p95_ms"
  | "failed_mission_planning_rate"
  | "blocked_action_rate"
  | "connector_degradation_rate"
  | "human_review_backlog";

export type SloCandidate = {
  id: string;
  subsystem: ControlPlaneSubsystem;
  metric: SloMetricId;
  description: string;
  /** null until operators configure evidence-based targets. */
  target: number | null;
  unit: "ratio" | "milliseconds" | "count";
  window: "1h" | "24h" | "7d";
};

export type BudgetScope = "capability" | "mission" | "global";

export type TokenBudget = {
  scope: BudgetScope;
  scopeId: string;
  maxTokens: number;
  usedTokens: number;
  maxModelCalls: number;
  usedModelCalls: number;
};

export type BudgetDecision =
  | { allowed: true; remainingTokens: number; remainingCalls: number }
  | {
      allowed: false;
      reason:
        | "token_budget_exhausted"
        | "model_call_budget_exhausted"
        | "cost_threshold"
        | "circuit_open"
        | "kill_switch"
        | "control_plane_disabled";
      fallback: "deterministic" | "manual" | "cheaper_route";
    };

export type CircuitBreakerName =
  | "model_provider"
  | "connector"
  | "high_error_rate"
  | "latency_threshold"
  | "kill_switch"
  | "cost_threshold";

export type CircuitState = "closed" | "open" | "half_open";

export type CircuitBreakerStatus = {
  name: CircuitBreakerName;
  targetId: string;
  state: CircuitState;
  openedAt?: string;
  failureCount: number;
  successCount: number;
  lastReasonCode?: string;
};

export type ControlPlaneAlertKind =
  | "action_execution_failure"
  | "replay_attempt"
  | "tenant_boundary_failure"
  | "connector_outage"
  | "human_review_backlog_high"
  | "eval_regression"
  | "kill_switch_activation"
  | "circuit_breaker_open"
  | "budget_exhausted"
  | "model_provider_outage";

/**
 * Alerts that MUST NOT fire: participant rejects recommendation,
 * participant edits preference, participant declines AI assist.
 */
export const PROHIBITED_ALERT_KINDS = [
  "participant_rejection",
  "participant_behaviour_score",
  "participant_compliance_score",
] as const;

export type ControlPlaneAlert = {
  id: string;
  kind: ControlPlaneAlertKind;
  severity: "info" | "warning" | "critical";
  subsystem: ControlPlaneSubsystem;
  reasonCode: string;
  at: string;
  traceId?: string;
  /** Aggregates only — never participant free text. */
  detail: Record<string, string | number | boolean | null>;
};

export type MetricCounterName =
  | "missions_planned"
  | "missions_failed_planning"
  | "actions_proposed"
  | "actions_blocked"
  | "actions_executed"
  | "actions_failed"
  | "actions_replayed"
  | "context_reads"
  | "recoveries_started"
  | "connector_calls"
  | "connector_degraded"
  | "connector_failed"
  | "model_calls"
  | "model_tokens"
  | "model_blocked"
  | "human_review_enqueued"
  | "human_review_resolved"
  | "tenant_boundary_failures"
  | "eval_pass"
  | "eval_fail"
  | "kill_switch_activations"
  | "circuit_opens"
  | "budget_exhaustions"
  | "deterministic_fallbacks"
  | "manual_fallbacks";

export type ControlPlaneHealthStatus =
  | "healthy"
  | "degraded"
  | "critical"
  | "disabled";

export type FeatureFlagSnapshot = {
  name: string;
  enabled: boolean;
};

export type KillSwitchSnapshot = {
  name: string;
  engaged: boolean;
};

export type ControlPlaneDashboard = {
  generatedAt: string;
  controlPlaneEnabled: boolean;
  overallHealth: ControlPlaneHealthStatus;
  subsystems: Array<{
    subsystem: ControlPlaneSubsystem;
    status: ControlPlaneHealthStatus;
    notes: string[];
  }>;
  failureReasons: Array<{ reasonCode: string; count: number }>;
  connectorHealth: Array<{
    connectorKey: string;
    status: ControlPlaneHealthStatus;
    circuitState: CircuitState;
  }>;
  queueHealth: {
    humanReviewBacklog: number;
    pendingActions: number;
  };
  modelSpend: {
    totalTokens: number;
    totalModelCalls: number;
    budgetExhaustions: number;
  };
  evalState: {
    passCount: number;
    failCount: number;
    lastRegressionAt: string | null;
  };
  featureFlags: FeatureFlagSnapshot[];
  killSwitches: KillSwitchSnapshot[];
  openCircuits: CircuitBreakerStatus[];
  recentAlerts: ControlPlaneAlert[];
  sloCandidates: SloCandidate[];
  /** Explicit privacy notice for operators. */
  privacyNote: string;
};

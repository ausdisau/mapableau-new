import { isAiControlPlaneEnabled } from "@/lib/config/ai-control-plane";

import { sanitizeControlPlaneDetail } from "./redaction";
import type {
  ControlPlaneAlert,
  ControlPlaneAlertKind,
  ControlPlaneSubsystem,
  PROHIBITED_ALERT_KINDS,
} from "./types";

/**
 * Operational alerts — never fire because a participant rejects recommendations.
 */

type ProhibitedKind = (typeof PROHIBITED_ALERT_KINDS)[number];

const alerts: ControlPlaneAlert[] = [];
const MAX_ALERTS = 200;

const PROHIBITED = new Set<string>([
  "participant_rejection",
  "participant_behaviour_score",
  "participant_compliance_score",
]);

let alertSeq = 0;

export function isProhibitedAlertKind(kind: string): kind is ProhibitedKind {
  return PROHIBITED.has(kind);
}

export function emitControlPlaneAlert(input: {
  kind: ControlPlaneAlertKind;
  severity: ControlPlaneAlert["severity"];
  subsystem: ControlPlaneSubsystem;
  reasonCode: string;
  traceId?: string;
  detail?: Record<string, unknown>;
}): ControlPlaneAlert | null {
  if (isProhibitedAlertKind(input.kind)) {
    throw new Error(`prohibited_alert_kind:${input.kind}`);
  }
  if (
    input.reasonCode === "participant_rejected" ||
    input.reasonCode === "participant_declined_recommendation"
  ) {
    return null;
  }
  if (!isAiControlPlaneEnabled()) return null;

  const alert: ControlPlaneAlert = {
    id: `cpa-${++alertSeq}-${Date.now()}`,
    kind: input.kind,
    severity: input.severity,
    subsystem: input.subsystem,
    reasonCode: input.reasonCode,
    at: new Date().toISOString(),
    traceId: input.traceId,
    detail: sanitizeControlPlaneDetail(input.detail ?? {}),
  };
  alerts.push(alert);
  if (alerts.length > MAX_ALERTS) {
    alerts.splice(0, alerts.length - MAX_ALERTS);
  }
  return alert;
}

export function listControlPlaneAlerts(limit = 50): ControlPlaneAlert[] {
  return alerts.slice(-limit);
}

export function clearControlPlaneAlerts(): void {
  alerts.length = 0;
  alertSeq = 0;
}

export function alertActionExecutionFailure(input: {
  reasonCode: string;
  traceId?: string;
  actionKey?: string;
}): void {
  emitControlPlaneAlert({
    kind: "action_execution_failure",
    severity: "warning",
    subsystem: "action_kernel",
    reasonCode: input.reasonCode,
    traceId: input.traceId,
    detail: { actionKey: input.actionKey ?? null },
  });
}

export function alertReplayAttempt(input: {
  reasonCode: string;
  traceId?: string;
}): void {
  emitControlPlaneAlert({
    kind: "replay_attempt",
    severity: "info",
    subsystem: "action_kernel",
    reasonCode: input.reasonCode,
    traceId: input.traceId,
    detail: {},
  });
}

export function alertTenantBoundaryFailure(input: {
  reasonCode: string;
  traceId?: string;
}): void {
  emitControlPlaneAlert({
    kind: "tenant_boundary_failure",
    severity: "critical",
    subsystem: "capabilities",
    reasonCode: input.reasonCode,
    traceId: input.traceId,
    detail: {},
  });
}

export function alertConnectorOutage(input: {
  connectorKey: string;
  reasonCode: string;
  traceId?: string;
}): void {
  emitControlPlaneAlert({
    kind: "connector_outage",
    severity: "critical",
    subsystem: "connector_gateway",
    reasonCode: input.reasonCode,
    traceId: input.traceId,
    detail: { connectorKey: input.connectorKey },
  });
}

export function alertHumanReviewBacklog(input: {
  backlog: number;
  threshold: number;
}): void {
  if (input.backlog < input.threshold) return;
  emitControlPlaneAlert({
    kind: "human_review_backlog_high",
    severity: "warning",
    subsystem: "human_review",
    reasonCode: "human_review_backlog_threshold",
    detail: {
      backlog: input.backlog,
      threshold: input.threshold,
    },
  });
}

export function alertEvalRegression(input: {
  reasonCode: string;
  failedScenarioId?: string;
}): void {
  emitControlPlaneAlert({
    kind: "eval_regression",
    severity: "warning",
    subsystem: "evaluations",
    reasonCode: input.reasonCode,
    detail: {
      failedScenarioId: input.failedScenarioId ?? null,
    },
  });
}

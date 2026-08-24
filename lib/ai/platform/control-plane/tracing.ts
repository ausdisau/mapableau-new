import { randomUUID } from "crypto";

import { captureAiPlatformTelemetry } from "@/lib/ai/platform/telemetry/adapter";
import { isAiControlPlaneEnabled } from "@/lib/config/ai-control-plane";

import { sanitizeControlPlaneDetail } from "./redaction";
import type {
  ControlPlaneSubsystem,
  ControlPlaneTraceContext,
  TraceSpanKind,
} from "./types";

/**
 * Trace propagation for mission → agent → capability → context → proposal →
 * approval → execution → connector → recovery.
 * Emits reason codes only; never raw participant content.
 */

const activeSpans = new Map<string, ControlPlaneTraceContext>();
const completedSpans: ControlPlaneTraceContext[] = [];
const MAX_COMPLETED = 500;

export function createControlPlaneTraceId(): string {
  return randomUUID();
}

export function createSpanId(): string {
  return randomUUID();
}

export function startTraceSpan(input: {
  traceId: string;
  missionId?: string;
  parentSpanId?: string;
  kind: TraceSpanKind;
  subsystem: ControlPlaneSubsystem;
  capabilityKey?: string;
  connectorKey?: string;
  agentId?: string;
}): ControlPlaneTraceContext {
  const span: ControlPlaneTraceContext = {
    traceId: input.traceId,
    missionId: input.missionId,
    spanId: createSpanId(),
    parentSpanId: input.parentSpanId,
    kind: input.kind,
    subsystem: input.subsystem,
    capabilityKey: input.capabilityKey,
    connectorKey: input.connectorKey,
    agentId: input.agentId,
    startedAt: new Date().toISOString(),
  };
  if (isAiControlPlaneEnabled()) {
    activeSpans.set(span.spanId, span);
  }
  return span;
}

export function endTraceSpan(
  spanId: string,
  outcome: {
    success: boolean;
    reasonCode?: string;
    detail?: Record<string, unknown>;
  },
): ControlPlaneTraceContext | null {
  const span = activeSpans.get(spanId);
  if (!span) return null;
  const endedAt = new Date().toISOString();
  const latencyMs = Math.max(
    0,
    Date.parse(endedAt) - Date.parse(span.startedAt),
  );
  const completed: ControlPlaneTraceContext = {
    ...span,
    endedAt,
    success: outcome.success,
    reasonCode: outcome.reasonCode,
    latencyMs,
  };
  activeSpans.delete(spanId);
  if (isAiControlPlaneEnabled()) {
    completedSpans.push(completed);
    if (completedSpans.length > MAX_COMPLETED) {
      completedSpans.splice(0, completedSpans.length - MAX_COMPLETED);
    }
    const safeDetail = sanitizeControlPlaneDetail(outcome.detail ?? {});
    captureAiPlatformTelemetry({
      kind: `trace.${span.kind}`,
      capabilityKey: span.capabilityKey ?? `control_plane.${span.subsystem}`,
      reason: outcome.reasonCode,
      tenantScoped: Boolean(span.missionId),
      latencyMs,
      success: outcome.success,
    });
    void safeDetail;
  }
  return completed;
}

export function getTraceChain(traceId: string): ControlPlaneTraceContext[] {
  const done = completedSpans.filter((s) => s.traceId === traceId);
  const active = [...activeSpans.values()].filter((s) => s.traceId === traceId);
  return [...done, ...active].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt),
  );
}

export function propagateTraceFields(input: {
  traceId: string;
  parentSpanId?: string;
  missionId?: string;
}): { traceId: string; parentSpanId?: string; missionId?: string } {
  return {
    traceId: input.traceId,
    parentSpanId: input.parentSpanId,
    missionId: input.missionId,
  };
}

export function clearTraceStore(): void {
  activeSpans.clear();
  completedSpans.length = 0;
}

export function listRecentSpans(limit = 50): ControlPlaneTraceContext[] {
  return completedSpans.slice(-limit);
}

import { isAiControlPlaneEnabled } from "@/lib/config/ai-control-plane";

import {
  assertNoProhibitedParticipantMetrics,
  containsProhibitedParticipantContent,
} from "./redaction";
import type { MetricCounterName } from "./types";

/**
 * In-memory control-plane metrics — system health aggregates only.
 * No participant behavioural scoring counters are permitted.
 */

const counters = new Map<MetricCounterName, number>();
const reasonCounts = new Map<string, number>();
const latencies: number[] = [];
const MAX_LATENCIES = 1_000;

const ALL_METRIC_NAMES: MetricCounterName[] = [
  "missions_planned",
  "missions_failed_planning",
  "actions_proposed",
  "actions_blocked",
  "actions_executed",
  "actions_failed",
  "actions_replayed",
  "context_reads",
  "recoveries_started",
  "connector_calls",
  "connector_degraded",
  "connector_failed",
  "model_calls",
  "model_tokens",
  "model_blocked",
  "human_review_enqueued",
  "human_review_resolved",
  "tenant_boundary_failures",
  "eval_pass",
  "eval_fail",
  "kill_switch_activations",
  "circuit_opens",
  "budget_exhaustions",
  "deterministic_fallbacks",
  "manual_fallbacks",
];

function assertMetricAllowed(name: MetricCounterName): void {
  const check = assertNoProhibitedParticipantMetrics([name]);
  if (!check.ok) {
    throw new Error(`prohibited_metric:${check.offenders.join(",")}`);
  }
}

export function incrementMetric(name: MetricCounterName, by = 1): number {
  assertMetricAllowed(name);
  if (!isAiControlPlaneEnabled()) {
    return counters.get(name) ?? 0;
  }
  const next = (counters.get(name) ?? 0) + by;
  counters.set(name, next);
  return next;
}

export function getMetric(name: MetricCounterName): number {
  return counters.get(name) ?? 0;
}

export function recordFailureReason(reasonCode: string): void {
  if (!isAiControlPlaneEnabled()) return;
  if (!reasonCode || reasonCode.length > 120) return;
  reasonCounts.set(reasonCode, (reasonCounts.get(reasonCode) ?? 0) + 1);
}

export function recordLatencySample(latencyMs: number): void {
  if (!isAiControlPlaneEnabled()) return;
  if (!Number.isFinite(latencyMs) || latencyMs < 0) return;
  latencies.push(latencyMs);
  if (latencies.length > MAX_LATENCIES) {
    latencies.splice(0, latencies.length - MAX_LATENCIES);
  }
}

export function estimateLatencyP95(): number | null {
  if (latencies.length === 0) return null;
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil(sorted.length * 0.95) - 1,
  );
  return sorted[Math.max(0, idx)] ?? null;
}

export function getFailureReasonCounts(): Array<{
  reasonCode: string;
  count: number;
}> {
  return [...reasonCounts.entries()]
    .map(([reasonCode, count]) => ({ reasonCode, count }))
    .sort((a, b) => b.count - a.count);
}

export function snapshotMetrics(): Record<MetricCounterName, number> {
  const out = {} as Record<MetricCounterName, number>;
  for (const name of ALL_METRIC_NAMES) {
    out[name] = counters.get(name) ?? 0;
  }
  return out;
}

export function humanReviewBacklog(): number {
  const enqueued = getMetric("human_review_enqueued");
  const resolved = getMetric("human_review_resolved");
  return Math.max(0, enqueued - resolved);
}

export function clearMetrics(): void {
  counters.clear();
  reasonCounts.clear();
  latencies.length = 0;
}

export function metricsContainProhibitedContent(): boolean {
  const snap = snapshotMetrics();
  if (containsProhibitedParticipantContent(snap)) return true;
  return containsProhibitedParticipantContent(getFailureReasonCounts());
}

export function listRegisteredMetricNames(): MetricCounterName[] {
  return [...ALL_METRIC_NAMES];
}

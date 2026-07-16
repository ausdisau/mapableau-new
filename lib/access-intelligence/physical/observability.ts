/**
 * In-memory metrics for Physical Systems (brief observability list).
 */
export type PhysicalMetricName =
  | "physical_action_proposed"
  | "physical_action_user_approved"
  | "physical_action_venue_approved"
  | "physical_action_execute_start"
  | "physical_action_succeeded"
  | "physical_action_failed"
  | "physical_action_timeout"
  | "physical_action_cancelled"
  | "physical_safety_deny"
  | "physical_simulator_event"
  | "physical_visit_planned"
  | "physical_scout_candidates"
  | "physical_scout_review"
  | "physical_kill_switch_block"
  | "physical_mode_clamp";

type CounterKey = string;

const counters = new Map<CounterKey, number>();

function keyFor(
  name: PhysicalMetricName,
  labels?: Record<string, string>,
): CounterKey {
  if (!labels || Object.keys(labels).length === 0) return name;
  const parts = Object.keys(labels)
    .sort()
    .map((k) => `${k}=${labels[k]}`);
  return `${name}|${parts.join(",")}`;
}

export function recordMetric(
  name: PhysicalMetricName,
  labels?: Record<string, string>,
): void {
  const key = keyFor(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

export function getMetric(
  name: PhysicalMetricName,
  labels?: Record<string, string>,
): number {
  return counters.get(keyFor(name, labels)) ?? 0;
}

export function getAllMetrics(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}

export function resetMetrics(): void {
  counters.clear();
}

import type { MapAbleConnectorKey } from "./types";

export type CircuitState = "closed" | "open" | "half_open";

type CircuitBreakerRecord = {
  connectorKey: MapAbleConnectorKey;
  state: CircuitState;
  failures: number;
  openedAt: number | null;
  successInHalfOpen: number;
};

const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 30_000;

const circuits = new Map<MapAbleConnectorKey, CircuitBreakerRecord>();

function getOrCreate(key: MapAbleConnectorKey): CircuitBreakerRecord {
  let record = circuits.get(key);
  if (!record) {
    record = {
      connectorKey: key,
      state: "closed",
      failures: 0,
      openedAt: null,
      successInHalfOpen: 0,
    };
    circuits.set(key, record);
  }
  return record;
}

export function getCircuitState(key: MapAbleConnectorKey): CircuitState {
  const record = getOrCreate(key);
  maybeTransitionFromOpen(record);
  return record.state;
}

export function isCircuitAllowingCalls(key: MapAbleConnectorKey): boolean {
  const state = getCircuitState(key);
  return state === "closed" || state === "half_open";
}

export function recordCircuitSuccess(key: MapAbleConnectorKey): void {
  const record = getOrCreate(key);
  if (record.state === "half_open") {
    record.successInHalfOpen += 1;
    if (record.successInHalfOpen >= 1) {
      record.state = "closed";
      record.failures = 0;
      record.openedAt = null;
      record.successInHalfOpen = 0;
    }
    return;
  }
  record.failures = 0;
}

export function recordCircuitFailure(
  key: MapAbleConnectorKey,
  options?: { failureThreshold?: number },
): CircuitState {
  const record = getOrCreate(key);
  const threshold = options?.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
  record.failures += 1;

  if (record.state === "half_open" || record.failures >= threshold) {
    record.state = "open";
    record.openedAt = Date.now();
    record.successInHalfOpen = 0;
  }
  return record.state;
}

function maybeTransitionFromOpen(record: CircuitBreakerRecord): void {
  if (record.state !== "open" || record.openedAt == null) return;
  if (Date.now() - record.openedAt >= DEFAULT_COOLDOWN_MS) {
    record.state = "half_open";
    record.successInHalfOpen = 0;
  }
}

export function forceOpenCircuit(key: MapAbleConnectorKey): void {
  const record = getOrCreate(key);
  record.state = "open";
  record.openedAt = Date.now();
  record.failures = DEFAULT_FAILURE_THRESHOLD;
}

export function clearCircuitBreakers(): void {
  circuits.clear();
}

export function getCircuitSnapshot(
  key: MapAbleConnectorKey,
): CircuitBreakerRecord {
  return { ...getOrCreate(key) };
}

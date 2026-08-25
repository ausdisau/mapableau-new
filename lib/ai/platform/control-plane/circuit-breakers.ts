import { actionKernelConfig } from "@/lib/config/action-kernel";
import { adaptiveRecoveryConfig } from "@/lib/config/adaptive-recovery";
import { isAiControlPlaneEnabled } from "@/lib/config/ai-control-plane";
import { aiPlatformConfig } from "@/lib/config/ai-platform";

import { emitControlPlaneAlert } from "./alerts";
import { incrementMetric } from "./metrics";
import type {
  CircuitBreakerName,
  CircuitBreakerStatus,
  CircuitState,
} from "./types";

/**
 * Circuit breakers for model provider, connectors, error rate, latency,
 * kill switches, and cost thresholds. In-memory only (no Prisma migration).
 */

type BreakerConfig = {
  failureThreshold: number;
  successThreshold: number;
  openMs: number;
  latencyMsThreshold?: number;
};

const DEFAULT_CONFIG: BreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  openMs: 30_000,
  latencyMsThreshold: 5_000,
};

const configs = new Map<string, BreakerConfig>();
const breakers = new Map<string, CircuitBreakerStatus>();

function keyOf(name: CircuitBreakerName, targetId: string): string {
  return `${name}:${targetId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getOrCreate(
  name: CircuitBreakerName,
  targetId: string,
): CircuitBreakerStatus {
  const key = keyOf(name, targetId);
  let status = breakers.get(key);
  if (!status) {
    status = {
      name,
      targetId,
      state: "closed",
      failureCount: 0,
      successCount: 0,
    };
    breakers.set(key, status);
  }
  return status;
}

function configFor(name: CircuitBreakerName, targetId: string): BreakerConfig {
  return configs.get(keyOf(name, targetId)) ?? DEFAULT_CONFIG;
}

function transitionToOpen(
  status: CircuitBreakerStatus,
  reasonCode: string,
): void {
  status.state = "open";
  status.openedAt = nowIso();
  status.lastReasonCode = reasonCode;
  status.successCount = 0;
  incrementMetric("circuit_opens");
  emitControlPlaneAlert({
    kind: "circuit_breaker_open",
    severity: "warning",
    subsystem:
      status.name === "connector"
        ? "connector_gateway"
        : status.name === "model_provider"
          ? "model_gateway"
          : "capabilities",
    reasonCode,
    detail: {
      breaker: status.name,
      targetId: status.targetId,
      failureCount: status.failureCount,
    },
  });
}

function maybeHalfOpen(status: CircuitBreakerStatus): void {
  if (status.state !== "open" || !status.openedAt) return;
  const cfg = configFor(status.name, status.targetId);
  const openedAt = Date.parse(status.openedAt);
  if (Date.now() - openedAt >= cfg.openMs) {
    status.state = "half_open";
  }
}

export function configureCircuitBreaker(
  name: CircuitBreakerName,
  targetId: string,
  config: Partial<BreakerConfig>,
): void {
  configs.set(keyOf(name, targetId), {
    ...DEFAULT_CONFIG,
    ...config,
  });
  getOrCreate(name, targetId);
}

export function getCircuitState(
  name: CircuitBreakerName,
  targetId: string,
): CircuitBreakerStatus | null {
  syncKillSwitchCircuits();
  const status = breakers.get(keyOf(name, targetId));
  if (!status) return null;
  maybeHalfOpen(status);
  return { ...status };
}

export function isCircuitAllowingTraffic(
  name: CircuitBreakerName,
  targetId: string,
): boolean {
  syncKillSwitchCircuits();
  const status = getOrCreate(name, targetId);
  maybeHalfOpen(status);
  return status.state === "closed" || status.state === "half_open";
}

export function recordCircuitFailure(
  name: CircuitBreakerName,
  targetId: string,
  reasonCode: string,
  latencyMs?: number,
): CircuitBreakerStatus {
  if (!isAiControlPlaneEnabled() && name !== "kill_switch") {
    return getOrCreate(name, targetId);
  }
  const status = getOrCreate(name, targetId);
  const cfg = configFor(name, targetId);
  status.failureCount += 1;
  status.lastReasonCode = reasonCode;
  status.successCount = 0;

  if (
    latencyMs !== undefined &&
    cfg.latencyMsThreshold !== undefined &&
    latencyMs >= cfg.latencyMsThreshold
  ) {
    transitionToOpen(status, "latency_threshold_exceeded");
    return { ...status };
  }

  if (status.state === "half_open") {
    transitionToOpen(status, reasonCode);
    return { ...status };
  }

  if (status.failureCount >= cfg.failureThreshold) {
    transitionToOpen(status, reasonCode);
  }
  return { ...status };
}

export function recordCircuitSuccess(
  name: CircuitBreakerName,
  targetId: string,
): CircuitBreakerStatus {
  const status = getOrCreate(name, targetId);
  const cfg = configFor(name, targetId);
  maybeHalfOpen(status);

  if (status.state === "half_open") {
    status.successCount += 1;
    if (status.successCount >= cfg.successThreshold) {
      status.state = "closed";
      status.failureCount = 0;
      status.successCount = 0;
      status.openedAt = undefined;
      status.lastReasonCode = "recovered";
    }
    return { ...status };
  }

  if (status.state === "closed") {
    status.failureCount = 0;
    status.successCount += 1;
  }
  return { ...status };
}

export function openCircuit(
  name: CircuitBreakerName,
  targetId: string,
  reasonCode: string,
): CircuitBreakerStatus {
  const status = getOrCreate(name, targetId);
  transitionToOpen(status, reasonCode);
  return { ...status };
}

export function closeCircuit(
  name: CircuitBreakerName,
  targetId: string,
): CircuitBreakerStatus {
  const status = getOrCreate(name, targetId);
  status.state = "closed";
  status.failureCount = 0;
  status.successCount = 0;
  status.openedAt = undefined;
  status.lastReasonCode = "manual_close";
  return { ...status };
}

function syncKillSwitchCircuits(): void {
  const engaged =
    aiPlatformConfig.globalKillSwitch ||
    actionKernelConfig.killSwitchEngaged ||
    adaptiveRecoveryConfig.killSwitchActive;

  const status = getOrCreate("kill_switch", "global");
  if (engaged && status.state !== "open") {
    transitionToOpen(status, "kill_switch_engaged");
    incrementMetric("kill_switch_activations");
    emitControlPlaneAlert({
      kind: "kill_switch_activation",
      severity: "critical",
      subsystem: "capabilities",
      reasonCode: "kill_switch_engaged",
      detail: {
        global: aiPlatformConfig.globalKillSwitch,
        actionKernel: actionKernelConfig.killSwitchEngaged,
        recovery: adaptiveRecoveryConfig.killSwitchActive,
      },
    });
  } else if (!engaged && status.state === "open") {
    status.state = "closed";
    status.failureCount = 0;
    status.openedAt = undefined;
    status.lastReasonCode = "kill_switch_cleared";
  }
}

export function listCircuitBreakers(): CircuitBreakerStatus[] {
  syncKillSwitchCircuits();
  return [...breakers.values()].map((b) => {
    maybeHalfOpen(b);
    return { ...b };
  });
}

export function listOpenCircuits(): CircuitBreakerStatus[] {
  return listCircuitBreakers().filter((b) => b.state === "open");
}

export function clearCircuitBreakers(): void {
  breakers.clear();
  configs.clear();
}

export type { CircuitState };

import {
  getCircuitState,
  isCircuitAllowingCalls,
} from "./circuit-breaker";
import { requireMapAbleConnector } from "./registry";
import type {
  ConnectorHealthState,
  MapAbleConnectorKey,
} from "./types";

type HealthRecord = {
  connectorKey: MapAbleConnectorKey;
  state: ConnectorHealthState;
  lastProbeAt: string | null;
  lastError: string | null;
  manualFallbackRequired: boolean;
};

const healthStore = new Map<MapAbleConnectorKey, HealthRecord>();

function envKillSwitch(key: string): boolean {
  return process.env[key] === "true";
}

function envFeatureFlag(key: string): boolean {
  return process.env[key] === "true";
}

function getOrCreate(key: MapAbleConnectorKey): HealthRecord {
  let record = healthStore.get(key);
  if (!record) {
    record = {
      connectorKey: key,
      state: "disabled",
      lastProbeAt: null,
      lastError: null,
      manualFallbackRequired: false,
    };
    healthStore.set(key, record);
  }
  return record;
}

export function evaluateConnectorHealth(
  key: MapAbleConnectorKey,
  gatewayOperational: boolean,
): ConnectorHealthState {
  const connector = requireMapAbleConnector(key);
  const record = getOrCreate(key);

  if (!gatewayOperational) {
    record.state = "disabled";
    return record.state;
  }

  if (envKillSwitch(connector.killSwitchKey)) {
    record.state = "kill_switched";
    record.manualFallbackRequired = true;
    return record.state;
  }

  if (!envFeatureFlag(connector.featureFlag)) {
    record.state = "disabled";
    return record.state;
  }

  if (!isCircuitAllowingCalls(key)) {
    record.state = "circuit_open";
    record.manualFallbackRequired = true;
    return record.state;
  }

  const circuit = getCircuitState(key);
  if (circuit === "half_open") {
    record.state = "degraded";
    return record.state;
  }

  if (record.manualFallbackRequired && record.lastError) {
    record.state = "degraded";
    return record.state;
  }

  record.state = "healthy";
  return record.state;
}

export function markConnectorProbe(
  key: MapAbleConnectorKey,
  outcome: "ok" | "error",
  errorDetail?: string,
): void {
  const record = getOrCreate(key);
  record.lastProbeAt = new Date().toISOString();
  if (outcome === "ok") {
    record.lastError = null;
    record.manualFallbackRequired = false;
  } else {
    record.lastError = errorDetail ?? "probe_failed";
    record.manualFallbackRequired = true;
  }
}

export function markManualFallback(
  key: MapAbleConnectorKey,
  required: boolean,
): void {
  const record = getOrCreate(key);
  record.manualFallbackRequired = required;
  if (required && record.state === "healthy") {
    record.state = "degraded";
  }
}

export function getConnectorHealthSnapshot(
  key: MapAbleConnectorKey,
): HealthRecord {
  return { ...getOrCreate(key) };
}

export function clearConnectorHealth(): void {
  healthStore.clear();
}

export function manualFallbackHint(key: MapAbleConnectorKey): string {
  return `Connector ${key} unavailable — use non-AI / human operational path. Do not retry unboundedly.`;
}

/**
 * Server-side MapAble Civic feature flags.
 * Production defaults keep the platform dark (shadow-safe).
 */

import type { CivicMode } from "./types";

export type CivicFeatureFlag =
  | "civicEnabled"
  | "assetRegistry"
  | "twin"
  | "journeyGraph"
  | "observatory"
  | "incidentNetwork"
  | "reliability"
  | "simulator"
  | "consultation"
  | "procurement"
  | "regional"
  | "emergency"
  | "openData";

export const CIVIC_DISABLED_CODE = "MAPABLE_CIVIC_DISABLED";

const ENV_KEYS: Record<CivicFeatureFlag, string> = {
  civicEnabled: "MAPABLE_CIVIC_ENABLED",
  assetRegistry: "MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED",
  twin: "MAPABLE_CIVIC_TWIN_ENABLED",
  journeyGraph: "MAPABLE_CIVIC_JOURNEY_GRAPH_ENABLED",
  observatory: "MAPABLE_CIVIC_OBSERVATORY_ENABLED",
  incidentNetwork: "MAPABLE_CIVIC_INCIDENT_NETWORK_ENABLED",
  reliability: "MAPABLE_CIVIC_RELIABILITY_ENABLED",
  simulator: "MAPABLE_CIVIC_SIMULATOR_ENABLED",
  consultation: "MAPABLE_CIVIC_CONSULTATION_ENABLED",
  procurement: "MAPABLE_CIVIC_PROCUREMENT_ENABLED",
  regional: "MAPABLE_CIVIC_REGIONAL_ENABLED",
  emergency: "MAPABLE_CIVIC_EMERGENCY_ENABLED",
  openData: "MAPABLE_CIVIC_OPEN_DATA_ENABLED",
};

const PRODUCTION_DEFAULTS: Record<CivicFeatureFlag, boolean> = {
  civicEnabled: false,
  assetRegistry: false,
  twin: false,
  journeyGraph: false,
  observatory: false,
  incidentNetwork: false,
  reliability: false,
  simulator: false,
  consultation: false,
  procurement: false,
  regional: false,
  emergency: false,
  openData: false,
};

/** Local/dev: registry only — never Observatory, incidents, or simulation. */
const DEVELOPMENT_DEFAULTS: Record<CivicFeatureFlag, boolean> = {
  ...PRODUCTION_DEFAULTS,
  civicEnabled: true,
  assetRegistry: true,
};

function parseBool(val: string | undefined): boolean | undefined {
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return undefined;
}

function baseDefaults(): Record<CivicFeatureFlag, boolean> {
  return process.env.NODE_ENV === "development"
    ? { ...DEVELOPMENT_DEFAULTS }
    : { ...PRODUCTION_DEFAULTS };
}

export function getCivicFeatureFlags(): Record<CivicFeatureFlag, boolean> {
  const flags = baseDefaults();
  for (const key of Object.keys(flags) as CivicFeatureFlag[]) {
    const override = parseBool(process.env[ENV_KEYS[key]]);
    if (override !== undefined) flags[key] = override;
  }
  return flags;
}

export function isCivicEnabled(): boolean {
  return getCivicFeatureFlags().civicEnabled;
}

export function isCivicFlagEnabled(flag: CivicFeatureFlag): boolean {
  const flags = getCivicFeatureFlags();
  if (!flags.civicEnabled) return false;
  return flags[flag];
}

export function getCivicMode(): CivicMode {
  const raw = (process.env.MAPABLE_CIVIC_MODE ?? "shadow").toLowerCase();
  switch (raw) {
    case "demo":
    case "shadow":
    case "pilot":
    case "production":
      return raw;
    default:
      return "shadow";
  }
}

/** Wave 1 defaults to memory store; set false only when Prisma tables are applied. */
export function useCivicMemoryStore(): boolean {
  const override = parseBool(process.env.MAPABLE_CIVIC_USE_MEMORY);
  if (override !== undefined) return override;
  return true;
}

export function civicEnvKey(flag: CivicFeatureFlag): string {
  return ENV_KEYS[flag];
}

/**
 * Server-side AccessibilityOps feature flags.
 * All enforcement flags default off. Production defaults keep the platform dark.
 */

import type { AccessibilityOpsMode } from "./types";

export type AccessibilityOpsFeatureFlag =
  | "opsEnabled"
  | "assetRegistry"
  | "ruleRegistry"
  | "changeDetection"
  | "impactGraph"
  | "testLab"
  | "incidents"
  | "remediation"
  | "procurement"
  | "releaseGates"
  | "reliability"
  | "livedExperience"
  | "publicEvidence"
  | "gateWebReleases"
  | "gateMobileReleases"
  | "gateDocuments"
  | "gateVenueGuides"
  | "gatePartners";

const ENV_KEYS: Record<AccessibilityOpsFeatureFlag, string> = {
  opsEnabled: "MAPABLE_ACCESSIBILITY_OPS_ENABLED",
  assetRegistry: "MAPABLE_ACCESSIBILITY_ASSET_REGISTRY_ENABLED",
  ruleRegistry: "MAPABLE_ACCESSIBILITY_RULE_REGISTRY_ENABLED",
  changeDetection: "MAPABLE_ACCESSIBILITY_CHANGE_DETECTION_ENABLED",
  impactGraph: "MAPABLE_ACCESSIBILITY_IMPACT_GRAPH_ENABLED",
  testLab: "MAPABLE_ACCESSIBILITY_TEST_LAB_ENABLED",
  incidents: "MAPABLE_ACCESSIBILITY_INCIDENTS_ENABLED",
  remediation: "MAPABLE_ACCESSIBILITY_REMEDIATION_ENABLED",
  procurement: "MAPABLE_ACCESSIBILITY_PROCUREMENT_ENABLED",
  releaseGates: "MAPABLE_ACCESSIBILITY_RELEASE_GATES_ENABLED",
  reliability: "MAPABLE_ACCESSIBILITY_RELIABILITY_ENABLED",
  livedExperience: "MAPABLE_ACCESSIBILITY_LIVED_EXPERIENCE_ENABLED",
  publicEvidence: "MAPABLE_ACCESSIBILITY_PUBLIC_EVIDENCE_ENABLED",
  gateWebReleases: "MAPABLE_ACCESSIBILITY_GATE_WEB_RELEASES",
  gateMobileReleases: "MAPABLE_ACCESSIBILITY_GATE_MOBILE_RELEASES",
  gateDocuments: "MAPABLE_ACCESSIBILITY_GATE_DOCUMENTS",
  gateVenueGuides: "MAPABLE_ACCESSIBILITY_GATE_VENUE_GUIDES",
  gatePartners: "MAPABLE_ACCESSIBILITY_GATE_PARTNERS",
};

const PRODUCTION_DEFAULTS: Record<AccessibilityOpsFeatureFlag, boolean> = {
  opsEnabled: false,
  assetRegistry: false,
  ruleRegistry: false,
  changeDetection: false,
  impactGraph: false,
  testLab: false,
  incidents: false,
  remediation: false,
  procurement: false,
  releaseGates: false,
  reliability: false,
  livedExperience: false,
  publicEvidence: false,
  gateWebReleases: false,
  gateMobileReleases: false,
  gateDocuments: false,
  gateVenueGuides: false,
  gatePartners: false,
};

/** Local/dev defaults enable registry + shadow test lab only — never release gates. */
const DEVELOPMENT_DEFAULTS: Record<AccessibilityOpsFeatureFlag, boolean> = {
  ...PRODUCTION_DEFAULTS,
  opsEnabled: true,
  assetRegistry: true,
  ruleRegistry: true,
  testLab: true,
};

function parseBool(val: string | undefined): boolean | undefined {
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return undefined;
}

function baseDefaults(): Record<AccessibilityOpsFeatureFlag, boolean> {
  return process.env.NODE_ENV === "development"
    ? { ...DEVELOPMENT_DEFAULTS }
    : { ...PRODUCTION_DEFAULTS };
}

export function getAccessibilityOpsFeatureFlags(): Record<
  AccessibilityOpsFeatureFlag,
  boolean
> {
  const flags = baseDefaults();
  for (const key of Object.keys(flags) as AccessibilityOpsFeatureFlag[]) {
    const override = parseBool(process.env[ENV_KEYS[key]]);
    if (override !== undefined) flags[key] = override;
  }
  return flags;
}

export function isAccessibilityOpsEnabled(): boolean {
  return getAccessibilityOpsFeatureFlags().opsEnabled;
}

export function isAccessibilityOpsFlagEnabled(
  flag: AccessibilityOpsFeatureFlag
): boolean {
  const flags = getAccessibilityOpsFeatureFlags();
  if (!flags.opsEnabled && flag !== "opsEnabled") return false;
  return flags[flag];
}

export function getAccessibilityOpsMode(): AccessibilityOpsMode {
  const raw = (process.env.MAPABLE_ACCESSIBILITY_OPS_MODE ?? "shadow").toLowerCase();
  if (
    raw === "demo" ||
    raw === "shadow" ||
    raw === "supervised" ||
    raw === "production"
  ) {
    return raw;
  }
  return "shadow";
}

/** Prefer memory store for unit tests / demo when env set or Prisma tables unavailable. */
export function useAccessibilityOpsMemoryStore(): boolean {
  const override = parseBool(process.env.MAPABLE_ACCESSIBILITY_OPS_USE_MEMORY);
  if (override !== undefined) return override;
  return process.env.NODE_ENV === "test";
}

export const ACCESSIBILITY_OPS_DISABLED_CODE = "ACCESSIBILITY_OPS_DISABLED";

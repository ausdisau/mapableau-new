/**
 * Composition adapter for Access Intelligence (not a second AI platform).
 * On main, AI engines live on unmerged remotes. When those modules merge,
 * they register via `registerAccessIntelligenceBridge` — AccessibilityOps
 * never forks fit/confidence/route/regression SoT.
 */

export type AccessIntelligenceComposeStatus =
  | "unavailable_on_main"
  | "available"
  | "flag_disabled";

export interface AccessIntelligenceBridge {
  placeBinding?: boolean;
  fitEngine?: boolean;
  confidenceEngine?: boolean;
  routeEngine?: boolean;
  counterfactualEngine?: boolean;
  regressionRunner?: boolean;
  reliabilityFreshness?: boolean;
  runRegression?: (input: {
    syntheticProfileIds: string[];
    placeIds: string[];
    correlationId: string;
  }) => Promise<{ runId: string }>;
}

export interface AccessIntelligenceComposeCapabilities {
  status: AccessIntelligenceComposeStatus;
  placeBinding: boolean;
  fitEngine: boolean;
  confidenceEngine: boolean;
  routeEngine: boolean;
  counterfactualEngine: boolean;
  regressionRunner: boolean;
  reliabilityFreshness: boolean;
  modulePathHints: string[];
}

const MODULE_PATH_HINTS = [
  "lib/access-intelligence/place-binding.ts",
  "lib/access-intelligence/fit-engine.ts",
  "lib/access-intelligence/confidence-engine.ts",
  "lib/access-intelligence/route-engine.ts",
  "lib/access-intelligence/counterfactual",
  "lib/access-intelligence/regression",
  "lib/access-intelligence/reliability",
];

let bridge: AccessIntelligenceBridge | null = null;

/** Called by Access Intelligence on module load when merged into main. */
export function registerAccessIntelligenceBridge(
  next: AccessIntelligenceBridge
): void {
  bridge = next;
}

export function clearAccessIntelligenceBridge(): void {
  bridge = null;
}

export function probeAccessIntelligenceCompose(): AccessIntelligenceComposeCapabilities {
  if (!bridge) {
    return {
      status: "unavailable_on_main",
      placeBinding: false,
      fitEngine: false,
      confidenceEngine: false,
      routeEngine: false,
      counterfactualEngine: false,
      regressionRunner: false,
      reliabilityFreshness: false,
      modulePathHints: MODULE_PATH_HINTS,
    };
  }
  return {
    status: "available",
    placeBinding: Boolean(bridge.placeBinding),
    fitEngine: Boolean(bridge.fitEngine),
    confidenceEngine: Boolean(bridge.confidenceEngine),
    routeEngine: Boolean(bridge.routeEngine),
    counterfactualEngine: Boolean(bridge.counterfactualEngine),
    regressionRunner: Boolean(bridge.regressionRunner),
    reliabilityFreshness: Boolean(bridge.reliabilityFreshness),
    modulePathHints: MODULE_PATH_HINTS,
  };
}

/**
 * Canonical place reference for AccessibilityOps assets.
 * Always uses AccessPlace identity — never invents a second place table.
 */
export function accessPlaceCanonicalRef(accessPlaceId: string): string {
  return `access_place:${accessPlaceId}`;
}

/**
 * When AI regression is registered, AccessibilityOps calls it — not a fork.
 */
export async function runAccessIntelligenceRegressionIfAvailable(input: {
  syntheticProfileIds: string[];
  placeIds: string[];
  correlationId: string;
}): Promise<{
  invoked: boolean;
  reason: string;
  runId: string | null;
}> {
  const probe = probeAccessIntelligenceCompose();
  if (!probe.regressionRunner || !bridge?.runRegression) {
    return {
      invoked: false,
      reason: "access_intelligence_regression_unavailable",
      runId: null,
    };
  }
  const result = await bridge.runRegression(input);
  return {
    invoked: true,
    reason: "delegated_to_access_intelligence",
    runId: result.runId,
  };
}

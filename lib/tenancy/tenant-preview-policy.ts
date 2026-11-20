function enabled(name: string, defaultOn = false) {
  const value = process.env[name];
  if (value === undefined) return defaultOn;
  return value === "true";
}

export type TenantPreviewGate = {
  masterEnabled: boolean;
  brandOsEnabled: boolean;
  provisioningPreviewEnabled: boolean;
  demoActorEnabled: boolean;
  hostRewriteEnabled: boolean;
  syntheticBanner: string;
};

/**
 * Deterministic feature + status gates. All new flags default OFF.
 * Host rewrite requires master enablement — proposed host alone never activates.
 */
export function getTenantPreviewGate(): TenantPreviewGate {
  const masterEnabled = enabled("MAPABLE_COVERAGE_CARE_ENABLED");
  return {
    masterEnabled,
    brandOsEnabled: enabled("MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED"),
    provisioningPreviewEnabled: enabled(
      "MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED",
    ),
    demoActorEnabled: enabled("MAPABLE_COVERAGE_CARE_DEMO_ACTOR"),
    // Host rewrite only when master flag is on (fail-closed).
    hostRewriteEnabled: masterEnabled,
    syntheticBanner: "SYNTHETIC DEMO — NOT LIVE",
  };
}

export function assertTenantPreviewEnabled() {
  if (!getTenantPreviewGate().masterEnabled) {
    throw new Error("TENANT_PREVIEW_DISABLED");
  }
}

export function isTenantPreviewPath(pathname: string): boolean {
  return (
    pathname === "/t" ||
    pathname.startsWith("/t/") ||
    pathname === "/coverage-care" ||
    pathname.startsWith("/coverage-care/")
  );
}

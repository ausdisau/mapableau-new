/**
 * Physical Systems operational mode — server-side only.
 * Clients must never override these values; read exclusively from process.env.
 */

export type PhysicalOperationalMode = "demo" | "shadow" | "supervised" | "live";

const VALID_MODES = new Set<PhysicalOperationalMode>([
  "demo",
  "shadow",
  "supervised",
  "live",
]);

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "Physical Systems configuration is server-only and must not be imported in client bundles.",
    );
  }
}

function readEnvBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  return defaultValue;
}

function parseRequestedMode(): PhysicalOperationalMode {
  const raw = (process.env.ACCESS_PHYSICAL_MODE ?? "demo").toLowerCase().trim();
  if (VALID_MODES.has(raw as PhysicalOperationalMode)) {
    return raw as PhysicalOperationalMode;
  }
  return "demo";
}

/**
 * Effective operational mode after live-enable and kill-switch clamps.
 * LIVE is only reachable when ACCESS_PHYSICAL_LIVE_ENABLED=true and kill switch is off.
 * If LIVE is requested but live is disabled, clamps to supervised (or shadow when shadow-only).
 */
export function getPhysicalMode(): PhysicalOperationalMode {
  assertServerOnly();
  const requested = parseRequestedMode();
  if (requested === "demo") return "demo";

  if (isGlobalKillSwitchOn()) {
    return "shadow";
  }

  if (requested === "live") {
    if (!isLiveEnabled()) {
      return isShadowOnly() ? "shadow" : "supervised";
    }
    return "live";
  }

  if (requested === "supervised" && isShadowOnly()) {
    return "shadow";
  }

  return requested;
}

export function isLiveEnabled(): boolean {
  assertServerOnly();
  return readEnvBool("ACCESS_PHYSICAL_LIVE_ENABLED", false);
}

/**
 * Global kill switch. Default false for demo mode; may be true in other modes via env.
 */
export function isGlobalKillSwitchOn(): boolean {
  assertServerOnly();
  const requested = parseRequestedMode();
  const defaultKill = requested !== "demo" ? false : false;
  return readEnvBool("ACCESS_PHYSICAL_GLOBAL_KILL_SWITCH", defaultKill);
}

/**
 * Shadow-only: default true when not in demo mode.
 * When true, real actuation is blocked (simulation / observation only).
 */
export function isShadowOnly(): boolean {
  assertServerOnly();
  const requested = parseRequestedMode();
  const defaultShadow = requested !== "demo";
  return readEnvBool("ACCESS_PHYSICAL_SHADOW_ONLY", defaultShadow);
}

/** True when effective mode may perform simulated or live actuation (not pure observation). */
export function canActuate(): boolean {
  const mode = getPhysicalMode();
  if (isGlobalKillSwitchOn()) return false;
  if (mode === "shadow") return false;
  if (mode === "live") return isLiveEnabled() && !isGlobalKillSwitchOn();
  // demo + supervised: simulated actuation allowed
  return true;
}

export function getPhysicalConfigurationSnapshot(): {
  requestedMode: PhysicalOperationalMode;
  effectiveMode: PhysicalOperationalMode;
  liveEnabled: boolean;
  shadowOnly: boolean;
  killSwitch: boolean;
  canActuate: boolean;
} {
  assertServerOnly();
  return {
    requestedMode: parseRequestedMode(),
    effectiveMode: getPhysicalMode(),
    liveEnabled: isLiveEnabled(),
    shadowOnly: isShadowOnly(),
    killSwitch: isGlobalKillSwitchOn(),
    canActuate: canActuate(),
  };
}

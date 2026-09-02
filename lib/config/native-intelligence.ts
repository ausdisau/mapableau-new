/**
 * MapAble-native intelligence R&D layer flags.
 * Fail-closed: when OFF, portfolio routing and local adapters stay inert.
 * Does not replace the production model gateway or expand authority.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const NATIVE_INTELLIGENCE_RND_FLAG =
  "MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED";
export const LOCAL_MODEL_ROUTING_FLAG = "MAPABLE_LOCAL_MODEL_ROUTING_ENABLED";

export const nativeIntelligenceConfig = {
  /** Master switch for MapAble-owned model portfolio R&D (Labs / experimental only). */
  get enabled(): boolean {
    return envFlag(NATIVE_INTELLIGENCE_RND_FLAG, false);
  },
  /** Allow experimental local/open-weight routes when R&D master is also on. */
  get localModelRoutingEnabled(): boolean {
    return (
      this.enabled && envFlag(LOCAL_MODEL_ROUTING_FLAG, false)
    );
  },
};

export function isNativeIntelligenceRndEnabled(): boolean {
  return nativeIntelligenceConfig.enabled;
}

export function isLocalModelRoutingEnabled(): boolean {
  return nativeIntelligenceConfig.localModelRoutingEnabled;
}

/**
 * Context Fabric + Temporal Event Bus feature flags.
 * Fail-closed: perception surfaces require explicit enablement.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const CONTEXT_FABRIC_FLAG = "MAPABLE_CONTEXT_FABRIC_ENABLED";
export const CONTEXT_EVENT_ROUTING_FLAG = "MAPABLE_CONTEXT_EVENT_ROUTING_ENABLED";
export const CONTEXT_FABRIC_KILL_SWITCH_FLAG = "MAPABLE_CONTEXT_FABRIC_KILL_SWITCH";

export const contextFabricConfig = {
  get enabled(): boolean {
    return envFlag(CONTEXT_FABRIC_FLAG, false) && !this.killSwitchActive;
  },
  get eventRoutingEnabled(): boolean {
    return this.enabled && envFlag(CONTEXT_EVENT_ROUTING_FLAG, false);
  },
  get killSwitchActive(): boolean {
    return envFlag(CONTEXT_FABRIC_KILL_SWITCH_FLAG, false);
  },
};

export function isContextFabricEnabled(): boolean {
  return contextFabricConfig.enabled;
}

export function isContextEventRoutingEnabled(): boolean {
  return contextFabricConfig.eventRoutingEnabled;
}

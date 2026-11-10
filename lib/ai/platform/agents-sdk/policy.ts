import {
  MAPABLE_AGENT_DOMAINS,
  PERMANENTLY_PROHIBITED_ACTIONS,
  type MapAbleAgentDomain,
  type MapAbleAgentsContext,
  type PermanentlyProhibitedAction,
} from "./contracts";

export function isMapAbleAgentDomain(value: string): value is MapAbleAgentDomain {
  return (MAPABLE_AGENT_DOMAINS as readonly string[]).includes(value);
}

export function isPermanentlyProhibited(
  action: string,
): action is PermanentlyProhibitedAction {
  return (PERMANENTLY_PROHIBITED_ACTIONS as readonly string[]).includes(action);
}

export function assertNotPermanentlyProhibited(action: string): void {
  if (isPermanentlyProhibited(action)) {
    throw new Error(`MAPABLE_AGENT_PROHIBITED:${action}`);
  }
}

export function assertDomainEnabled(
  context: MapAbleAgentsContext,
  domain: MapAbleAgentDomain,
): void {
  if (context.aiOptedOut) {
    throw new Error("MAPABLE_AGENT_AI_OPTED_OUT");
  }
  if (!context.enabledDomains.includes(domain)) {
    throw new Error(`MAPABLE_AGENT_DOMAIN_DISABLED:${domain}`);
  }
}

/**
 * First live slice: Access only. Other domains remain topology contracts.
 */
export function defaultEnabledDomainsForCapability(
  capabilityKey: string,
): MapAbleAgentDomain[] {
  if (capabilityKey.startsWith("navigator.provider_search.")) {
    return ["access"];
  }
  return [];
}

export function assertMcpToolAllowlisted(
  context: MapAbleAgentsContext,
  toolName: string,
): void {
  if (!context.mcpToolAllowlist.includes(toolName)) {
    throw new Error(`MAPABLE_AGENT_MCP_TOOL_DENIED:${toolName}`);
  }
}

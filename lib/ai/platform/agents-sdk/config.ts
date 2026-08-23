/**
 * MapAble Agents SDK orchestration flags.
 * All default false — fail closed until explicitly enabled for controlled pilot.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const agentsSdkConfig = {
  get enabled(): boolean {
    return envFlag("MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED", false);
  },
  /** Opt-in stdio MCP for local dev/evals only — never in Vercel handlers. */
  get mcpLocalEnabled(): boolean {
    return envFlag("MAPABLE_AGENTS_SDK_MCP_LOCAL", false);
  },
};

export function isAgentsSdkEnabled(): boolean {
  return agentsSdkConfig.enabled;
}

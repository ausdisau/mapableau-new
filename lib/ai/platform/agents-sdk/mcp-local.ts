import type { MapAbleAgentsContext } from "./contracts";
import { assertMcpToolAllowlisted } from "./policy";

/**
 * Local MCP is opt-in for developer machines only.
 * Never use stdio MCP from Vercel request handlers.
 */
export function isLocalMcpAllowed(): boolean {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    return false;
  }
  return process.env.MAPABLE_AGENTS_SDK_LOCAL_MCP === "true";
}

export function assertLocalMcpTool(
  context: MapAbleAgentsContext,
  toolName: string,
): void {
  if (!isLocalMcpAllowed()) {
    throw new Error("MAPABLE_AGENT_LOCAL_MCP_DISABLED");
  }
  assertMcpToolAllowlisted(context, toolName);
}

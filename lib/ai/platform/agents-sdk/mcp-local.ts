/**
 * Opt-in stdio MCP for local dev/evals only.
 * NEVER import this module from Vercel request handlers or production routes.
 */
import { getAllMcpTools, MCPServerStdio } from "@openai/agents";
import type { Tool } from "@openai/agents";

import { agentsSdkConfig } from "./config";
import type { MapAbleAgentRunContext } from "./contracts";

export type LocalMcpServerId = "av" | "careos";

const SERVER_COMMANDS: Record<
  LocalMcpServerId,
  { command: string; args: string[] }
> = {
  av: { command: "pnpm", args: ["mcp:av"] },
  careos: { command: "pnpm", args: ["mcp:careos"] },
};

export function assertMcpLocalAllowed(): void {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    throw new Error("AGENTS_SDK_MCP_VERCEL_FORBIDDEN");
  }
  if (!agentsSdkConfig.mcpLocalEnabled) {
    throw new Error("AGENTS_SDK_MCP_LOCAL_DISABLED");
  }
}

export async function connectLocalMcpServer(
  serverId: LocalMcpServerId,
): Promise<MCPServerStdio> {
  assertMcpLocalAllowed();
  const spec = SERVER_COMMANDS[serverId];
  const server = new MCPServerStdio({
    name: `mapable-${serverId}`,
    command: spec.command,
    args: spec.args,
  });
  await server.connect();
  return server;
}

export function filterMcpToolsToAllowlist(
  tools: Tool[],
  ctx: MapAbleAgentRunContext,
): Tool[] {
  const allowed = new Set(ctx.toolAllowlist);
  return tools.filter((t) => allowed.has(t.name));
}

export async function listFilteredLocalMcpTools(input: {
  ctx: MapAbleAgentRunContext;
  servers: LocalMcpServerId[];
}): Promise<Tool[]> {
  assertMcpLocalAllowed();
  const connected = await Promise.all(
    input.servers.map((id) => connectLocalMcpServer(id)),
  );
  try {
    const all = await getAllMcpTools(connected);
    return filterMcpToolsToAllowlist(all, input.ctx);
  } finally {
    await Promise.all(connected.map((s) => s.close()));
  }
}

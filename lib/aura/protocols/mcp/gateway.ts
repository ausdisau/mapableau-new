import { auraConfig } from "@/lib/aura/config";

/**
 * MCP gateway. AURA does not accept arbitrary MCP servers. Every server must
 * be pre-registered with a pinned version and pass a conformance check. Even
 * after approval, writes go through the AURA execution gateway — MCP tool
 * calls never bypass authority + consent evaluation.
 *
 * When AURA_MCP_ENABLED is false, every call returns `not_configured` and no
 * network I/O is initiated.
 */

export interface McpServerRecord {
  id: string;
  slug: string;
  displayName: string;
  endpoint: string;
  versionPin: string;
  approvedAt: Date | null;
  conformancePassed: boolean;
  productionActivated: boolean;
}

export type McpGatewayVerdict =
  | { verdict: "allowed"; server: McpServerRecord }
  | { verdict: "not_configured"; reason: string }
  | { verdict: "denied"; code: McpDenyCode; reason: string };

export type McpDenyCode =
  | "server_not_registered"
  | "server_not_approved"
  | "server_conformance_pending"
  | "server_not_production_activated"
  | "version_pin_mismatch"
  | "mcp_globally_disabled";

export interface McpEvaluationInput {
  requestedSlug: string;
  requestedVersion: string;
  registry: McpServerRecord[];
  configOverrides?: Partial<typeof auraConfig>;
}

export function evaluateMcpAccess(
  input: McpEvaluationInput
): McpGatewayVerdict {
  const config = { ...auraConfig, ...(input.configOverrides ?? {}) };
  if (!config.mcpEnabled) {
    return {
      verdict: "not_configured",
      reason: "AURA_MCP_ENABLED is false — MCP integration is disabled.",
    };
  }
  const server = input.registry.find((s) => s.slug === input.requestedSlug);
  if (!server) {
    return {
      verdict: "denied",
      code: "server_not_registered",
      reason: `MCP server '${input.requestedSlug}' is not in the AURA registry.`,
    };
  }
  if (!server.approvedAt) {
    return {
      verdict: "denied",
      code: "server_not_approved",
      reason: "Server has not been approved by a platform administrator.",
    };
  }
  if (!server.conformancePassed) {
    return {
      verdict: "denied",
      code: "server_conformance_pending",
      reason: "Server has not passed the MCP conformance suite.",
    };
  }
  if (!server.productionActivated) {
    return {
      verdict: "denied",
      code: "server_not_production_activated",
      reason: "Server is not production-activated.",
    };
  }
  if (server.versionPin !== input.requestedVersion) {
    return {
      verdict: "denied",
      code: "version_pin_mismatch",
      reason: `Server version pin '${server.versionPin}' does not match requested '${input.requestedVersion}'.`,
    };
  }
  return { verdict: "allowed", server };
}

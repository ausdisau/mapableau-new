import { auraConfig } from "@/lib/aura/config";

/**
 * AURA MCP endpoint. Returns `not_configured` unless AURA_MCP_ENABLED is true.
 * Even when enabled, this endpoint does NOT execute tool calls; it advertises
 * discovery so callers can request approval to add an MCP server via the
 * admin console. All actual tool calls go through the execution gateway.
 */

export const dynamic = "force-dynamic";

export function GET() {
  if (!auraConfig.mcpEnabled) {
    return Response.json(
      {
        status: "not_configured",
        reason: "AURA_MCP_ENABLED is false.",
        disclaimer:
          "AURA does not expose MCP tool calls directly. Server registration + conformance are required.",
      },
      { status: 503 }
    );
  }
  return Response.json({
    status: "conformance_gated",
    reason:
      "MCP gateway is enabled but individual servers must pass conformance and be productionActivated by an admin.",
  });
}

export function POST() {
  return Response.json(
    {
      status: "not_configured",
      reason: "MCP tool execution is not permitted through this endpoint.",
    },
    { status: 405 }
  );
}

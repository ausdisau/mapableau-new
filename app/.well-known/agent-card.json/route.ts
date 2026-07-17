import { auraConfig } from "@/lib/aura/config";

/**
 * `/.well-known/agent-card.json` — SANDBOX card only. The card advertises that
 * AURA exists and is experimental; it does not enumerate participant-specific
 * capabilities or expose any participant data. When AURA is disabled globally
 * the card returns `not_configured`.
 */

export const dynamic = "force-dynamic";

export function GET() {
  const body = {
    name: "MapAble AURA",
    experimental: true,
    productionActivated: false,
    disclaimer:
      "AURA is not sentient, not a legal representative, not medical, and not a financial adviser.",
    a2a: auraConfig.a2aExperimentalEnabled
      ? { status: "experimental_registration_only" }
      : { status: "not_configured" },
    mcp: auraConfig.mcpEnabled
      ? { status: "gateway_isolated" }
      : { status: "not_configured" },
    contact:
      "AURA safety officer contact is available via the operator dashboard only.",
    supportedProtocols: [
      { name: "MCP", version: "pinned_per_server", exposed: false },
      { name: "A2A", version: "experimental", exposed: false },
    ],
  };
  return Response.json(body, {
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json",
    },
  });
}

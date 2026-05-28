import { listIntegrationsPublic } from "@/lib/integrations/integration-registry";
import type {
  IntegrationConnectionStatus,
  IntegrationPublicConfig,
} from "@/lib/integrations/integration-types";

/** Platform connectors providers most often ask about (read-only status; no admin settings). */
const PROVIDER_VISIBLE_INTEGRATION_KEYS = new Set([
  "postgres",
  "stripe",
  "maplibre",
  "ndia",
  "xero",
  "jitsi",
  "livekit",
  "calcom",
  "supabase",
]);

export type ProviderCloudIntegration = {
  key: string;
  displayName: string;
  type: IntegrationPublicConfig["type"];
  status: IntegrationConnectionStatus;
  enabled: boolean;
  healthLabel: string;
  lastHealthCheckAt: string | null;
};

export function formatProviderIntegrationHealthLabel(
  integration: Pick<
    IntegrationPublicConfig,
    "status" | "enabled" | "lastError" | "configured"
  >
): string {
  if (!integration.configured) return "Not configured";
  if (!integration.enabled && integration.status === "disabled") {
    return "Disabled";
  }
  switch (integration.status) {
    case "enabled":
      return "Operational";
    case "degraded":
      return integration.lastError ? `Degraded · ${integration.lastError}` : "Degraded";
    case "error":
      return integration.lastError ? `Issue · ${integration.lastError}` : "Error";
    default:
      return "Disabled";
  }
}

export async function getProviderCloudIntegrations(): Promise<
  ProviderCloudIntegration[]
> {
  const integrations = await listIntegrationsPublic();
  return integrations
    .filter((row) => PROVIDER_VISIBLE_INTEGRATION_KEYS.has(row.key))
    .map((row) => ({
      key: row.key,
      displayName: row.displayName,
      type: row.type,
      status: row.status,
      enabled: row.enabled,
      healthLabel: formatProviderIntegrationHealthLabel(row),
      lastHealthCheckAt: row.lastHealthCheckAt,
    }));
}

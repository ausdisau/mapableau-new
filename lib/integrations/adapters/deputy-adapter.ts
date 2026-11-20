import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";

/**
 * Platform registry adapter for Deputy.
 * Org-scoped OAuth and roster calls live under lib/integrations/deputy/ (PR2).
 * This adapter only reports enablement/health for /admin/integrations.
 */
export const deputyAdapter: IntegrationAdapter = {
  key: "deputy",
  type: "scheduling",
  displayName: "Deputy",
  isEnabled() {
    return integrationsFeatureFlags.deputyEnabled();
  },
  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!integrationsFeatureFlags.deputyEnabled()) {
      return {
        status: "unhealthy",
        message: "DEPUTY_ENABLED is false (default; draft rostering opt-in only)",
      };
    }
    const hasClient =
      Boolean(process.env.DEPUTY_CLIENT_ID?.trim()) &&
      Boolean(process.env.DEPUTY_CLIENT_SECRET?.trim());
    if (!hasClient) {
      return {
        status: "degraded",
        message: "DEPUTY_ENABLED but OAuth client credentials are not configured",
      };
    }
    return {
      status: "healthy",
      message:
        "Deputy adapter enabled; org OAuth and unpublished draft rosters only (no auto-publish)",
    };
  },
};

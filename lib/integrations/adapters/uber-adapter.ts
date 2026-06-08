import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import {
  isUberIntegrationEnabled,
  isUberSdkConfigured,
} from "@/lib/uber/config";
import { clearUberTokenCache, getUberAccessToken } from "@/lib/uber/oauth";

export const uberAdapter: IntegrationAdapter = {
  key: "uber",
  type: "rideshare",
  displayName: "Uber Guest Rides",

  isEnabled() {
    return isIntegrationEnvEnabled("uber") && isUberIntegrationEnabled();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!isUberSdkConfigured()) {
      return {
        status: "degraded",
        message:
          "Uber not configured (UBER_CLIENT_ID, UBER_CLIENT_SECRET, UBER_ORGANIZATION_UUID)",
      };
    }
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "Uber disabled (set UBER_ENABLED=true)",
      };
    }

    const started = Date.now();
    try {
      clearUberTokenCache();
      await getUberAccessToken();
      return {
        status: "healthy",
        latencyMs: Date.now() - started,
        message: "Uber OAuth token obtained",
      };
    } catch (err) {
      return {
        status: "unhealthy",
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : "Uber health check failed",
      };
    }
  },
};

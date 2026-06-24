import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import { phase5Config } from "@/lib/config/phase5";
import {
  isNdiaConfigComplete,
  isNdiaLiveSubmitAllowed,
} from "@/lib/ndia/shared/config";
import { probeNdiaConnection } from "@/lib/ndia/shared/ndia-http-client";

export const ndiaAdapter: IntegrationAdapter = {
  key: "ndia",
  type: "finance",
  displayName: "NDIA Provider Claiming",

  isEnabled() {
    return isIntegrationEnvEnabled("ndia") && phase5Config.ndiaReadinessEnabled;
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return { status: "degraded", message: "NDIA readiness module disabled" };
    }

    if (!isNdiaLiveSubmitAllowed()) {
      return {
        status: "healthy",
        message: `NDIA adapter active (mock mode; live submit: ${phase5Config.ndiaRealSubmissionEnabled})`,
      };
    }

    if (!isNdiaConfigComplete()) {
      return {
        status: "degraded",
        message: "Live submit enabled but NDIA OAuth/API config incomplete",
      };
    }

    const probe = await probeNdiaConnection();
    return probe.ok
      ? { status: "healthy", message: probe.message }
      : { status: "unhealthy", message: probe.message };
  },
};

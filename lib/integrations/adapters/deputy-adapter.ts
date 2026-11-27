import { isDeputyEnabled } from "@/lib/integrations/deputy/flags";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";

export const deputyAdapter: IntegrationAdapter = {
  key: "deputy",
  type: "scheduling",
  displayName: "Deputy",

  isEnabled() {
    return isDeputyEnabled();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "Deputy disabled (DEPUTY_ENABLED!=true)",
      };
    }
    return {
      status: "healthy",
      message: "Deputy enabled — draft unpublished shifts only; no auto-publish",
    };
  },
};

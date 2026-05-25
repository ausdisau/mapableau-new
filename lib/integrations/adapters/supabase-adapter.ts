import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import {
  getSupabasePublicConfig,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

export const supabaseAdapter: IntegrationAdapter = {
  key: "supabase",
  type: "database",
  displayName: "Supabase Postgres",

  isEnabled() {
    return isIntegrationEnvEnabled("supabase");
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return {
        status: "degraded",
        message: "Supabase not enabled via environment",
      };
    }

    const publicConfig = getSupabasePublicConfig();
    if (!publicConfig || !getSupabaseServiceRoleKey()) {
      return {
        status: "unhealthy",
        message: "Supabase URL, publishable key, or service role key missing",
      };
    }

    return {
      status: "healthy",
      message:
        "Supabase project configured; Prisma uses DATABASE_URL/DIRECT_URL",
    };
  },
};

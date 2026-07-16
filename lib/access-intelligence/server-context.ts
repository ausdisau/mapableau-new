import { accessIntelligenceConfig, isDemoMode } from "./configuration";
import type { ServerAccessContext } from "./types";

/**
 * Server-only runtime context. Never put credentials in model prompts.
 */
export function createServerAccessContext(input: {
  userId: string | null | undefined;
  organisationId?: string | null;
  selectedPassportId?: string | null;
}): ServerAccessContext {
  const demoMode = isDemoMode();
  const userId =
    input.userId?.trim() ||
    (demoMode ? accessIntelligenceConfig.demoUserId : "");

  return {
    userId,
    organisationId: input.organisationId ?? null,
    selectedPassportId: input.selectedPassportId ?? null,
    demoMode,
  };
}

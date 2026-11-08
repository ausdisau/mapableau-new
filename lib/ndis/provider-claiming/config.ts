import { phase5Config } from "@/lib/config/phase5";

/**
 * Legacy env wiring for provider claiming.
 * Presence of credentials or `NDIA_REAL_SUBMISSION_ENABLED` is NOT Digital
 * Partnership Office approval and MUST NOT enable network transport.
 */
export const ndiaProviderClaimingConfig = {
  /** Reserved for future technical-pack base URL — unused while transport is blocked. */
  apiBaseUrl: process.env.NDIA_PROVIDER_API_BASE_URL ?? "",
  apiClientId: process.env.NDIA_PROVIDER_API_CLIENT_ID ?? "",
  apiClientSecret: process.env.NDIA_PROVIDER_API_CLIENT_SECRET ?? "",
  tokenUrl: process.env.NDIA_PROVIDER_TOKEN_URL ?? "",
  adapterMode: (process.env.NDIA_PROVIDER_ADAPTER_MODE ?? "mock") as
    | "mock"
    | "http",
  requireHumanApproval:
    process.env.NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL !== "false",
};

export function isNdiaProviderClaimingEnabled(): boolean {
  return phase5Config.ndisClaimSubmissionEnabled;
}

/**
 * Historical “live allowed” composite.
 * Even when true, `ndia-api-client` and `claim-service` hard-block network I/O.
 */
export function isNdiaProviderLiveSubmitAllowed(): boolean {
  return (
    isNdiaProviderClaimingEnabled() &&
    phase5Config.ndiaRealSubmissionEnabled &&
    ndiaProviderClaimingConfig.adapterMode === "http" &&
    Boolean(ndiaProviderClaimingConfig.apiBaseUrl)
  );
}

/** Hazard signal for admin readiness UIs. */
export function isLegacyRealSubmissionFlagSet(): boolean {
  return phase5Config.ndiaRealSubmissionEnabled;
}

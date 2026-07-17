import { phase5Config } from "@/lib/config/phase5";

/**
 * Legacy NDIA provider claiming config.
 *
 * Wave 5 migration:
 * - Do not treat base URL / token URL / client credentials as sufficient for live submit.
 * - `NDIA_PROVIDER_CLAIM_SUBMIT_PATH` is deprecated (guessed path); ignored by the client.
 * - Live delivery moves to `lib/ndis-gateway/integrations` profiles + readiness gates.
 * - Prefer `NDIS_INTEGRATION_*` env flags for sandbox / kill-switch behaviour.
 */
export const ndiaProviderClaimingConfig = {
  /** @deprecated Wave 5: not used for live delivery selection. */
  apiBaseUrl: process.env.NDIA_PROVIDER_API_BASE_URL ?? "",
  /** @deprecated Wave 5: client_credentials live fetch removed. */
  apiClientId: process.env.NDIA_PROVIDER_API_CLIENT_ID ?? "",
  /** @deprecated Wave 5: client_credentials live fetch removed. */
  apiClientSecret: process.env.NDIA_PROVIDER_API_CLIENT_SECRET ?? "",
  /** @deprecated Wave 5: generic token URL assumptions removed. */
  tokenUrl: process.env.NDIA_PROVIDER_TOKEN_URL ?? "",
  /**
   * @deprecated Wave 5: guessed claim submit path. Kept for env compatibility only;
   * `submitProviderClaimToNdia` never uses this value.
   */
  claimSubmitPath: process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH ?? "",
  /** Use `mock` until a certified Wave 5 integration profile exists. */
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
 * Live NDIA submit is disabled by default (Wave 5).
 *
 * Returns false always until a certified `ExternalIntegrationProfile` exists and
 * readiness/kill-switch gates allow delivery. Environment flags alone
 * (`NDIA_REAL_SUBMISSION_ENABLED`, adapter mode, base URL) cannot enable guessed HTTP.
 */
export function isNdiaProviderLiveSubmitAllowed(): boolean {
  return false;
}

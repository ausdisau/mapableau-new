import { phase5Config } from "@/lib/config/phase5";

function readAdapterMode(): "mock" | "http" {
  return (process.env.NDIA_PROVIDER_ADAPTER_MODE ?? "mock") as "mock" | "http";
}

/** Read NDIA HTTP settings from env at call time (supports test env stubs). */
export function getNdiaHttpConfig() {
  return {
    apiBaseUrl: process.env.NDIA_PROVIDER_API_BASE_URL ?? "",
    apiClientId: process.env.NDIA_PROVIDER_API_CLIENT_ID ?? "",
    apiClientSecret: process.env.NDIA_PROVIDER_API_CLIENT_SECRET ?? "",
    tokenUrl: process.env.NDIA_PROVIDER_TOKEN_URL ?? "",
    adapterMode: readAdapterMode(),
    claimSubmitPath:
      process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH ?? "/v1/provider/claims",
    claimStatusPath:
      process.env.NDIA_PROVIDER_CLAIM_STATUS_PATH ??
      "/v1/provider/claims/{claimId}",
    requireHumanApproval:
      process.env.NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL !== "false",
    claimStatusPollEnabled:
      process.env.NDIA_CLAIM_STATUS_POLL_ENABLED !== "false",
    participantApiEnabled: process.env.NDIA_PARTICIPANT_API_ENABLED === "true",
    responseClaimIdFields: (
      process.env.NDIA_RESPONSE_CLAIM_ID_FIELDS ?? "claimId,id,externalId"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    responseStatusFields: (
      process.env.NDIA_RESPONSE_STATUS_FIELDS ?? "status,claimStatus,state"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** @deprecated Use getNdiaHttpConfig() — static snapshot for backward compatibility. */
export const ndiaHttpConfig = getNdiaHttpConfig();

export function isNdiaClaimingEnabled(): boolean {
  return (
    process.env.NDIS_CLAIM_SUBMISSION_ENABLED === "true" ||
    phase5Config.ndisClaimSubmissionEnabled
  );
}

export function isNdiaLiveSubmitAllowed(): boolean {
  const config = getNdiaHttpConfig();
  return (
    isNdiaClaimingEnabled() &&
    (process.env.NDIA_REAL_SUBMISSION_ENABLED === "true" ||
      phase5Config.ndiaRealSubmissionEnabled) &&
    config.adapterMode === "http" &&
    Boolean(config.apiBaseUrl)
  );
}

export function isNdiaConfigComplete(): boolean {
  const config = getNdiaHttpConfig();
  return Boolean(
    config.apiBaseUrl &&
      config.tokenUrl &&
      config.apiClientId &&
      config.apiClientSecret
  );
}

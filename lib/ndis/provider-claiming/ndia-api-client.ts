import {
  isNdiaProviderLiveSubmitAllowed,
  ndiaProviderClaimingConfig,
} from "@/lib/ndis/provider-claiming/config";
import { SYNTHETIC_EXTERNAL_STATUS } from "@/lib/ndis/provider-claiming/lifecycle";
import {
  assertNdiaLiveTransportBlocked,
  assertSubmitPathNotInvented,
} from "@/lib/ndis/provider-claiming/transport-gate";
import type { NdiaProviderClaimPayload } from "@/lib/ndis/provider-claiming/types";

export type NdiaSubmitResult = {
  /** `synthetic` replaces legacy `mock` — never government acknowledgement. */
  mode: "synthetic" | "http_blocked";
  externalClaimId: string;
  externalStatus: string;
  lifecyclePhase: "synthetic_validated" | "government_submission_blocked";
  notSubmitted: true;
  governmentReference: null;
  response?: unknown;
};

/**
 * @deprecated Token fetch assumed client_credentials without NDIA technical-pack evidence.
 * Retained only so tests can prove it is never called from the submit path.
 */
export async function fetchAccessTokenUnverified(): Promise<string> {
  throw new Error(
    "NDIA_TOKEN_FETCH_DISABLED: OAuth/token semantics are not independently verified; do not call",
  );
}

/**
 * Submit path for provider claims.
 * Live HTTP is hard-blocked until DPO technical pack + organisational approvals.
 * Synthetic path returns local validation only — never records government acknowledgement.
 */
export async function submitProviderClaimToNdia(
  payload: NdiaProviderClaimPayload,
): Promise<NdiaSubmitResult> {
  // Safety: reject invented configured paths even before the live flag check.
  assertSubmitPathNotInvented(process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH);

  if (isNdiaProviderLiveSubmitAllowed()) {
    // Live flag may be set in a misconfigured environment; still do not dial.
    assertNdiaLiveTransportBlocked();
  }

  // Ignore credentials / base URL — presence is not authority.
  void ndiaProviderClaimingConfig.apiBaseUrl;
  void ndiaProviderClaimingConfig.apiClientId;
  void ndiaProviderClaimingConfig.apiClientSecret;
  void ndiaProviderClaimingConfig.tokenUrl;

  const syntheticId = `ndia_synth_${payload.metadata.builtAt.replace(/[^0-9]/g, "").slice(0, 14) || "local"}`;

  return {
    mode: "synthetic",
    externalClaimId: syntheticId,
    externalStatus: SYNTHETIC_EXTERNAL_STATUS.validationOnly,
    lifecyclePhase: "synthetic_validated",
    notSubmitted: true,
    governmentReference: null,
    response: {
      message:
        "Synthetic validation only — not sent to NDIA. Authorised transport is not implemented.",
      payloadSummary: {
        lines: payload.lines.length,
        totalCents: payload.totals.totalCents,
        registration: payload.provider.ndisRegistrationNumber,
      },
      credentialsInspected: false,
      networkRequestPerformed: false,
    },
  };
}

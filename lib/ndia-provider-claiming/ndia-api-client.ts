import { createHash } from "node:crypto";

import {
  isNdiaProviderLiveSubmitAllowed,
  ndiaProviderClaimingConfig,
} from "@/lib/ndia-provider-claiming/config";
import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";

/**
 * Compatibility facade for legacy provider claim submission.
 *
 * Live HTTP delivery must go through the Wave 5 integration registry:
 * `lib/ndis-gateway/integrations` (simulator / manual portal / certified adapters).
 * This module must never guess NDIA endpoints or perform client_credentials submission.
 */

export type NdiaSubmitResult = {
  mode: "mock" | "http";
  externalClaimId: string;
  externalStatus: string;
  response?: unknown;
};

export type NdiaIntegrationErrorCode = "NDIA_TECHNICAL_SPEC_NOT_CONFIGURED";

export class NdiaIntegrationError extends Error {
  readonly code: NdiaIntegrationErrorCode;

  constructor(code: NdiaIntegrationErrorCode, message: string) {
    super(message);
    this.name = "NdiaIntegrationError";
    this.code = code;
  }
}

function deterministicMockClaimId(payload: NdiaProviderClaimPayload): string {
  const digest = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 24);
  return `ndia_mock_${digest}`;
}

/**
 * Submit claim via mock simulator path, or fail closed for live delivery.
 * Live submission requires an approved Wave 5 adapter profile — never guessed HTTP.
 */
export async function submitProviderClaimToNdia(
  payload: NdiaProviderClaimPayload
): Promise<NdiaSubmitResult> {
  if (!isNdiaProviderLiveSubmitAllowed()) {
    const mockId = deterministicMockClaimId(payload);
    return {
      mode: "mock",
      externalClaimId: mockId,
      externalStatus: "submitted_mock",
      response: {
        message:
          "Mock submission — live NDIA delivery is disabled until a certified Wave 5 integration profile is activated.",
        payloadSummary: {
          lines: payload.lines.length,
          totalCents: payload.totals.totalCents,
          registration: payload.provider.ndisRegistrationNumber,
          adapterMode: ndiaProviderClaimingConfig.adapterMode,
        },
      },
    };
  }

  // Live path fails closed: no client_credentials, no guessed /v1/provider/claims, no token cache.
  throw new NdiaIntegrationError(
    "NDIA_TECHNICAL_SPEC_NOT_CONFIGURED",
    "NDIA live submission is not configured. Use the Wave 5 integration registry (lib/ndis-gateway/integrations) with an approved technical pack and certified adapter profile."
  );
}

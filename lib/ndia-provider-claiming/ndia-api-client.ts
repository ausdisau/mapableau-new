import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";
import {
  getNdiaClaimStatus,
  submitProviderClaimPayload,
  type NdiaStatusResult,
  type NdiaSubmitResult,
} from "@/lib/ndia/shared/ndia-http-client";

export type { NdiaSubmitResult, NdiaStatusResult };

export async function submitProviderClaimToNdia(
  payload: NdiaProviderClaimPayload
): Promise<NdiaSubmitResult> {
  return submitProviderClaimPayload(payload);
}

export async function getProviderClaimStatusFromNdia(
  externalClaimId: string
): Promise<NdiaStatusResult> {
  return getNdiaClaimStatus(externalClaimId);
}

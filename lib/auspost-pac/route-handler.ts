import { AusPostPacApiError, auspostPacErrorResponse } from "@/lib/auspost-pac/auspost-pac-api-error";
import {
  auspostPacJsonError,
  type AusPostPacOperationId,
} from "@/lib/auspost-pac/api-contract";

export function handleAuspostPacRouteError(
  error: unknown,
  operationId: AusPostPacOperationId,
): Response {
  if (error instanceof AusPostPacApiError) {
    return auspostPacErrorResponse(error, operationId);
  }
  console.error("[auspost-pac]", error);
  return auspostPacJsonError(operationId, 500, {
    error: "An unexpected error occurred.",
    code: "AUSPOST_PAC_UPSTREAM_ERROR",
    retryable: true,
  });
}

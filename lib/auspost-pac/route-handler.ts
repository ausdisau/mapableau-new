import { AusPostPacApiError, auspostPacErrorResponse } from "@/lib/auspost-pac/auspost-pac-api-error";

export function handleAuspostPacRouteError(error: unknown): Response {
  if (error instanceof AusPostPacApiError) {
    return auspostPacErrorResponse(error);
  }
  console.error("[auspost-pac]", error);
  return Response.json(
    { error: "An unexpected error occurred.", code: "AUSPOST_PAC_UPSTREAM_ERROR" },
    { status: 500 },
  );
}

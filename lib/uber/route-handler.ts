import { ZodError } from "zod";

import { zodErrorResponse } from "@/lib/api/response";
import { isUberApiError } from "@/lib/uber/errors";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export function handleUberRouteError(e: unknown) {
  if (isUberApiError(e)) {
    const status = e.status >= 400 && e.status < 600 ? e.status : 502;
    return Response.json(
      {
        error: e.message,
        code: e.code ?? "UBER_API_ERROR",
        details: e.details,
      },
      { status }
    );
  }
  if (e instanceof TransportApiError) {
    return handleTransportRouteError(e);
  }
  if (e instanceof ZodError) return zodErrorResponse(e);
  console.error(e);
  return Response.json(
    { error: "Uber request failed.", code: "UBER_API_ERROR" },
    { status: 500 }
  );
}

import type { TransportErrorCode } from "@/types/transport";

const STATUS_BY_CODE: Record<TransportErrorCode, number> = {
  TRANSPORT_TRIP_NOT_FOUND: 404,
  TRANSPORT_ACCESS_DENIED: 403,
  TRANSPORT_CONSENT_REQUIRED: 403,
  TRANSPORT_INVALID_STATUS_TRANSITION: 409,
  TRANSPORT_DRIVER_NOT_ELIGIBLE: 422,
  TRANSPORT_VEHICLE_NOT_ELIGIBLE: 422,
  TRANSPORT_SCHEDULE_CONFLICT: 409,
  TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE: 503,
  TRANSPORT_ROUTE_NOT_FOUND: 404,
  TRANSPORT_OPTIMISATION_FAILED: 422,
  TRANSPORT_VALIDATION_FAILED: 400,
};

const PLAIN_MESSAGES: Record<TransportErrorCode, string> = {
  TRANSPORT_TRIP_NOT_FOUND: "We could not find that transport trip.",
  TRANSPORT_ACCESS_DENIED: "You do not have permission to access this trip.",
  TRANSPORT_CONSENT_REQUIRED:
    "The participant has not granted consent for you to view this trip.",
  TRANSPORT_INVALID_STATUS_TRANSITION:
    "That status change is not allowed for this trip.",
  TRANSPORT_DRIVER_NOT_ELIGIBLE:
    "The selected driver does not meet eligibility requirements.",
  TRANSPORT_VEHICLE_NOT_ELIGIBLE:
    "The selected vehicle does not meet eligibility requirements.",
  TRANSPORT_SCHEDULE_CONFLICT:
    "The driver or vehicle is not available at the requested time.",
  TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE:
    "Routing is not available right now. Please try again later.",
  TRANSPORT_ROUTE_NOT_FOUND: "We could not calculate a route for those locations.",
  TRANSPORT_OPTIMISATION_FAILED:
    "Route optimisation could not be completed. A planner can review manually.",
  TRANSPORT_VALIDATION_FAILED: "Some trip details were invalid. Please check and try again.",
};

export class TransportApiError extends Error {
  constructor(
    public code: TransportErrorCode,
    message?: string,
    public details?: unknown
  ) {
    super(message ?? PLAIN_MESSAGES[code]);
    this.name = "TransportApiError";
  }

  get httpStatus(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export function transportErrorResponse(error: TransportApiError) {
  return Response.json(
    {
      error: error.message,
      code: error.code,
      details: error.details,
    },
    { status: error.httpStatus }
  );
}

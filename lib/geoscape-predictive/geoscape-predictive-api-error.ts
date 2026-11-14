import type { GeoscapePredictiveErrorCode } from "@/types/geoscape-predictive";

const STATUS_BY_CODE: Record<GeoscapePredictiveErrorCode, number> = {
  GEOSCAPE_NOT_CONFIGURED: 503,
  GEOSCAPE_UPSTREAM_ERROR: 502,
  GEOSCAPE_VALIDATION_ERROR: 400,
  GEOSCAPE_NOT_FOUND: 404,
};

const PLAIN_MESSAGES: Record<GeoscapePredictiveErrorCode, string> = {
  GEOSCAPE_NOT_CONFIGURED:
    "Geoscape street address lookup is not configured. Set GEOSCAPE_API_KEY on the server.",
  GEOSCAPE_UPSTREAM_ERROR:
    "Geoscape could not complete the request. Please try again later.",
  GEOSCAPE_VALIDATION_ERROR: "The address request was invalid. Please check your input.",
  GEOSCAPE_NOT_FOUND: "That address suggestion could not be resolved.",
};

export class GeoscapePredictiveApiError extends Error {
  constructor(
    public code: GeoscapePredictiveErrorCode,
    message?: string,
    public details?: unknown,
  ) {
    super(message ?? PLAIN_MESSAGES[code]);
    this.name = "GeoscapePredictiveApiError";
  }

  get httpStatus(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export function geoscapeNotConfiguredError() {
  return new GeoscapePredictiveApiError("GEOSCAPE_NOT_CONFIGURED");
}

export function geoscapeUpstreamError(status: number, detail?: string) {
  return new GeoscapePredictiveApiError(
    "GEOSCAPE_UPSTREAM_ERROR",
    detail ?? `Geoscape API returned status ${status}.`,
    { upstreamStatus: status },
  );
}

export function geoscapeValidationError(detail?: string) {
  return new GeoscapePredictiveApiError(
    "GEOSCAPE_VALIDATION_ERROR",
    detail,
  );
}

export function geoscapeNotFoundError(detail?: string) {
  return new GeoscapePredictiveApiError("GEOSCAPE_NOT_FOUND", detail);
}

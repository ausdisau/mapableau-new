export type ContinuityOsErrorCode =
  | "CONTINUITY_OS_DISABLED"
  | "LIFE_EVENTS_DISABLED"
  | "DEPENDENCY_GRAPH_DISABLED"
  | "RESILIENCE_DISABLED"
  | "FAILURE_DETECTION_DISABLED"
  | "RECOVERY_OPTIONS_DISABLED"
  | "HANDOFFS_DISABLED"
  | "FRICTION_DISABLED"
  | "REGIONAL_RECOVERY_DISABLED"
  | "OUTCOME_VERIFICATION_DISABLED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "INVALID_STATE_TRANSITION"
  | "MISSION_STOPPED"
  | "HARD_REQUIREMENT_FAILED"
  | "SIMULATED_NOT_AVAILABLE"
  | "EXECUTION_FORBIDDEN"
  | "AUTOMATIC_ACTION_FORBIDDEN"
  | "HIGH_RISK_HUMAN_ONLY"
  | "IDEMPOTENCY_CONFLICT";

export class ContinuityOsError extends Error {
  readonly code: ContinuityOsErrorCode;
  readonly status: number;

  constructor(code: ContinuityOsErrorCode, message: string, status = 400) {
    super(message);
    this.name = "ContinuityOsError";
    this.code = code;
    this.status = status;
  }
}

export function continuityOsErrorResponse(error: unknown): Response {
  if (error instanceof ContinuityOsError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: error.status }
    );
  }
  console.error("[continuity-os]", error);
  return Response.json(
    { error: "INTERNAL_ERROR", message: "Unexpected ContinuityOS error." },
    { status: 500 }
  );
}

export function featureDisabledResponse(code: ContinuityOsErrorCode): Response {
  return Response.json(
    {
      error: code,
      message: "This ContinuityOS capability is disabled.",
    },
    { status: 503 }
  );
}

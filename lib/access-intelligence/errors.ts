export type AccessIntelligenceErrorCode =
  | "PASSPORT_NOT_FOUND"
  | "PLACE_NOT_FOUND"
  | "DESTINATION_NOT_FOUND"
  | "INSUFFICIENT_EVIDENCE"
  | "NO_ELIGIBLE_ROUTE"
  | "LIVE_STATUS_UNAVAILABLE"
  | "APPROVAL_REQUIRED"
  | "ACTION_CANCELLED"
  | "UNAUTHORISED"
  | "REPOSITORY_UNAVAILABLE"
  | "AI_PROVIDER_UNAVAILABLE"
  | "STRUCTURED_OUTPUT_INVALID"
  | "VALIDATION_ERROR";

export class AccessIntelligenceError extends Error {
  readonly code: AccessIntelligenceErrorCode;
  readonly recoveryHint: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AccessIntelligenceErrorCode,
    message: string,
    recoveryHint: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AccessIntelligenceError";
    this.code = code;
    this.recoveryHint = recoveryHint;
    this.details = details;
  }

  toPublicJson() {
    return {
      error: this.message,
      code: this.code,
      recoveryHint: this.recoveryHint,
    };
  }
}

export function isAccessIntelligenceError(
  error: unknown,
): error is AccessIntelligenceError {
  return error instanceof AccessIntelligenceError;
}

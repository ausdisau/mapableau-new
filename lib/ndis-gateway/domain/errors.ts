export type NdisGatewayErrorCode =
  | "FUNDING_ROUTE_UNKNOWN"
  | "FUNDING_ROUTE_BLOCKED"
  | "INVALID_STATUS_TRANSITION"
  | "PROVIDER_NOT_REGISTERED"
  | "SCHEMA_VALIDATION_FAILED"
  | "UNSUPPORTED_OPERATION";

export class NdisGatewayError extends Error {
  readonly code: NdisGatewayErrorCode;
  readonly plainLanguageMessage: string;
  readonly technicalMessage: string;

  constructor(params: {
    code: NdisGatewayErrorCode;
    plainLanguageMessage: string;
    technicalMessage: string;
  }) {
    super(params.technicalMessage);
    this.name = "NdisGatewayError";
    this.code = params.code;
    this.plainLanguageMessage = params.plainLanguageMessage;
    this.technicalMessage = params.technicalMessage;
  }
}

export function assertNever(value: never, message: string): never {
  throw new NdisGatewayError({
    code: "UNSUPPORTED_OPERATION",
    plainLanguageMessage: "Something unexpected happened while processing this claim.",
    technicalMessage: `${message}: ${String(value)}`,
  });
}

export type NdiaErrorCategory =
  | "validation"
  | "auth"
  | "duplicate"
  | "rate_limit"
  | "server"
  | "unknown";

export class NdiaApiError extends Error {
  readonly category: NdiaErrorCategory;
  readonly httpStatus?: number;
  readonly ndiaCode?: string;
  readonly responseBody?: unknown;

  constructor(
    message: string,
    category: NdiaErrorCategory,
    options?: {
      httpStatus?: number;
      ndiaCode?: string;
      responseBody?: unknown;
      cause?: unknown;
    }
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "NdiaApiError";
    this.category = category;
    this.httpStatus = options?.httpStatus;
    this.ndiaCode = options?.ndiaCode;
    this.responseBody = options?.responseBody;
  }

  toUserMessage(): string {
    switch (this.category) {
      case "auth":
        return "NDIA authentication failed. Check API credentials and token URL.";
      case "validation":
        return `NDIA rejected the claim: ${this.message}`;
      case "duplicate":
        return "This claim may already have been submitted to NDIA.";
      case "rate_limit":
        return "NDIA rate limit reached. Retry shortly.";
      case "server":
        return "NDIA service error. Try again later.";
      default:
        return this.message;
    }
  }
}

export function extractNdiaErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  const code =
    record.code ?? record.errorCode ?? record.error_code ?? record.reason;
  return typeof code === "string" ? code : undefined;
}

export function classifyNdiaHttpError(
  httpStatus: number,
  body: unknown,
  fallbackMessage?: string
): NdiaApiError {
  const ndiaCode = extractNdiaErrorCode(body);
  const message =
    (body &&
      typeof body === "object" &&
      typeof (body as Record<string, unknown>).message === "string" &&
      (body as Record<string, unknown>).message) ||
    (body &&
      typeof body === "object" &&
      typeof (body as Record<string, unknown>).error === "string" &&
      (body as Record<string, unknown>).error) ||
    fallbackMessage ||
    `NDIA request failed with status ${httpStatus}`;

  let category: NdiaErrorCategory = "unknown";
  if (httpStatus === 401 || httpStatus === 403) category = "auth";
  else if (httpStatus === 409) category = "duplicate";
  else if (httpStatus === 429) category = "rate_limit";
  else if (httpStatus >= 400 && httpStatus < 500) category = "validation";
  else if (httpStatus >= 500) category = "server";

  return new NdiaApiError(String(message), category, {
    httpStatus,
    ndiaCode,
    responseBody: body,
  });
}

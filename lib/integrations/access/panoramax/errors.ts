export class PanoramaxError extends Error {
  readonly code:
    | "NOT_CONFIGURED"
    | "DISABLED"
    | "TIMEOUT"
    | "HTTP_ERROR"
    | "INVALID_PAYLOAD"
    | "SSRF_BLOCKED"
    | "RATE_LIMITED"
    | "PUBLICATION_DENIED";
  readonly status: number;

  constructor(code: PanoramaxError["code"], message: string, status = 502) {
    super(message);
    this.name = "PanoramaxError";
    this.code = code;
    this.status = status;
  }
}

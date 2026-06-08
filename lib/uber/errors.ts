export class UberApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "UberApiError";
  }
}

export function isUberApiError(error: unknown): error is UberApiError {
  return error instanceof UberApiError;
}

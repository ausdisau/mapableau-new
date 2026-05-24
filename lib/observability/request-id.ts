import { randomUUID } from "crypto";

const HEADER = "x-request-id";

export function generateRequestId(): string {
  return randomUUID();
}

export function getRequestIdFromHeaders(
  headers: Headers | Record<string, string | null | undefined>
): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(HEADER) ?? undefined;
  }
  const value = headers[HEADER] ?? headers["X-Request-Id"];
  return value ?? undefined;
}

export const REQUEST_ID_HEADER = HEADER;

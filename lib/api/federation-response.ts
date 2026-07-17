import { ZodError } from "zod";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  "Pragma": "no-cache",
};

export function fedJson<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...NO_STORE_HEADERS,
    },
  });
}

export function fedError(
  code: string,
  status: number,
  extras?: Record<string, unknown>
): Response {
  return fedJson({ error: code, ...(extras ?? {}) }, status);
}

export function fedZodError(err: ZodError): Response {
  return fedJson(
    { error: "validation_failed", issues: err.flatten() },
    400
  );
}

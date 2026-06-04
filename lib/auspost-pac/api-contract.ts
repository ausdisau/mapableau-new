import type { AusPostPacErrorCode } from "@/types/auspost-pac";

/** Stable operation IDs for agents and OpenAPI (docs/api/openapi-auspost-pac.yaml). */
export const AUSPOST_PAC_OPERATIONS = {
  postcodeSearch: "auspostPostcodeSearch",
  domesticParcelServices: "auspostDomesticParcelServices",
  domesticParcelCalculate: "auspostDomesticParcelCalculate",
} as const;

export type AusPostPacOperationId =
  (typeof AUSPOST_PAC_OPERATIONS)[keyof typeof AUSPOST_PAC_OPERATIONS];

export type AusPostPacErrorBody = {
  error: string;
  code: AusPostPacErrorCode | "RATE_LIMITED" | "INVALID_QUERY";
  operationId: AusPostPacOperationId;
  details?: unknown;
  retryable?: boolean;
};

export function auspostPacJsonError(
  operationId: AusPostPacOperationId,
  status: number,
  body: Omit<AusPostPacErrorBody, "operationId">,
): Response {
  return Response.json(
    {
      operationId,
      retryable: body.retryable ?? status >= 500,
      ...body,
    } satisfies AusPostPacErrorBody,
    {
      status,
      headers: { "X-Operation-Id": operationId },
    },
  );
}

export function auspostPacJsonOk<T>(
  operationId: AusPostPacOperationId,
  body: T,
  init?: { headers?: Record<string, string> },
): Response {
  return Response.json(body, {
    headers: {
      "X-Operation-Id": operationId,
      ...init?.headers,
    },
  });
}

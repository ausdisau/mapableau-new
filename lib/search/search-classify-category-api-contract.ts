export const SEARCH_CLASSIFY_CATEGORY_OPERATIONS = {
  classifyCategory: "searchClassifyCategory",
} as const;

export type SearchClassifyCategoryOperationId =
  (typeof SEARCH_CLASSIFY_CATEGORY_OPERATIONS)[keyof typeof SEARCH_CLASSIFY_CATEGORY_OPERATIONS];

export type SearchClassifyCategoryErrorCode =
  | "SEARCH_CLASSIFY_NOT_CONFIGURED"
  | "SEARCH_CLASSIFY_VALIDATION_ERROR"
  | "SEARCH_CLASSIFY_UPSTREAM_ERROR"
  | "RATE_LIMITED";

export type SearchClassifyCategoryErrorBody = {
  error: string;
  code: SearchClassifyCategoryErrorCode;
  operationId: SearchClassifyCategoryOperationId;
  details?: unknown;
  retryable?: boolean;
};

export function searchClassifyCategoryJsonError(
  operationId: SearchClassifyCategoryOperationId,
  status: number,
  body: Omit<SearchClassifyCategoryErrorBody, "operationId">,
): Response {
  return Response.json(
    {
      operationId,
      retryable: body.retryable ?? status >= 500,
      ...body,
    } satisfies SearchClassifyCategoryErrorBody,
    {
      status,
      headers: { "X-Operation-Id": operationId },
    },
  );
}

export function searchClassifyCategoryJsonOk<T>(
  operationId: SearchClassifyCategoryOperationId,
  body: T,
): Response {
  return Response.json(body, {
    headers: { "X-Operation-Id": operationId },
  });
}

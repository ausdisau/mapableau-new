import { randomUUID } from "crypto";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import {
  executeGaisStructuredQuery,
  gaisStructuredQuerySchema,
} from "@/lib/gais/query";

export async function POST(req: Request) {
  if (!mapableGaisFlags.queryEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_QUERY_ENABLED");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = gaisStructuredQuerySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const queryId = `gais-query-${randomUUID()}`;
  const execution = await executeGaisStructuredQuery(parsed.data, queryId);

  if (!execution.ok) {
    return jsonError(execution.errors.join("; "), execution.status);
  }

  return jsonOk({
    ...execution.result,
    meta: {
      ...execution.result.meta,
      ...GAIS_RESPONSE_META,
    },
  });
}

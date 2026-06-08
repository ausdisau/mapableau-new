import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { suggestLineItemForSource } from "@/lib/ndis/ndis-suggestion-service";
import {
  assertCanAccessSuggestionSource,
  SuggestionSourceAccessError,
} from "@/lib/ndis/suggestion-source-access";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.sourceType || !body.sourceId) {
    return jsonError("sourceType and sourceId required", 400);
  }

  try {
    await assertCanAccessSuggestionSource(
      user,
      body.sourceType,
      body.sourceId
    );
  } catch (e) {
    if (e instanceof SuggestionSourceAccessError) {
      if (e.code === "NOT_FOUND") return jsonError(e.message, 404);
      if (e.code === "UNSUPPORTED") return jsonError(e.message, 400);
      return jsonError(e.message, 403);
    }
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    throw e;
  }

  const result = await suggestLineItemForSource(
    body.sourceType,
    body.sourceId,
    body.hints
  );
  return jsonOk({
    ...result,
    disclaimer:
      "Suggestion requires human review. Not NDIS approved or a claim guarantee.",
  });
}

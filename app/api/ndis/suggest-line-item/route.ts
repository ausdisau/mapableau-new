import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { suggestLineItemForSource } from "@/lib/ndis/ndis-suggestion-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.sourceType || !body.sourceId) {
    return jsonError("sourceType and sourceId required", 400);
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

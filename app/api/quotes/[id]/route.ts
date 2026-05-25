import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getQuoteRequest } from "@/lib/quotes/quote-request-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const quote = await getQuoteRequest(id);
  if (!quote) return jsonError("Not found", 404);
  if (quote.participantId !== user.id && user.primaryRole !== "mapable_admin") {
    return jsonError("Forbidden", 403);
  }
  return jsonOk({ quote });
}

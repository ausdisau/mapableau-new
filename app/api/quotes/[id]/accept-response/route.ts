import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { acceptQuoteResponse } from "@/lib/quotes/quote-conversion-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  if (!body.responseId) return jsonError("responseId required", 400);
  const result = await acceptQuoteResponse(id, body.responseId, user.id);
  return jsonOk(result);
}

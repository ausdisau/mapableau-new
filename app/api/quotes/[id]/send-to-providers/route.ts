import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { sendQuoteToProviders } from "@/lib/quotes/quote-request-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const quote = await sendQuoteToProviders(id, user.id);
  return jsonOk({ quote });
}

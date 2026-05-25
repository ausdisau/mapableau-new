import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createQuoteRequest,
  listQuoteRequests,
} from "@/lib/quotes/quote-request-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const quotes = await listQuoteRequests(user.id);
  return jsonOk({ quotes });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const quote = await createQuoteRequest({
    participantId: body.participantId ?? user.id,
    quoteType: body.quoteType,
    title: body.title,
    description: body.description,
    metadata: body.metadata,
    createdById: user.id,
    providerIds: body.providerIds,
  });
  return jsonOk({ quote }, 201);
}

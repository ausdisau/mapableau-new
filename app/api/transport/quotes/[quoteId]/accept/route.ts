import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { acceptQuote } from "@/lib/transport/transport-quote-service";
import { acceptQuoteSchema } from "@/lib/validation/transport-quote-schemas";

type Params = { params: Promise<{ quoteId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  try {
    const { quoteId } = await params;
    const body = acceptQuoteSchema.parse(await req.json());
    const result = await acceptQuote(user, quoteId, body.idempotencyKey);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return handleTransportRouteError(e);
    return handleTransportRouteError(e);
  }
}

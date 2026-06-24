import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { calculateQuote } from "@/lib/ndis-pricing/quote-calculator";
import { calculateQuoteSchema } from "@/types/ndis-pricing";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const input = calculateQuoteSchema.parse(await req.json());
    const audience =
      (new URL(req.url).searchParams.get("audience") as
        | "participant"
        | "provider"
        | "admin"
        | null) ?? "provider";
    const result = await calculateQuote(input, audience);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}

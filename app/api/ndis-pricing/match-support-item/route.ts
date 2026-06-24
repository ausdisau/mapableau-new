import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { matchSupportItems } from "@/lib/ndis-pricing/support-item-matcher";
import { matchSupportItemSchema } from "@/types/ndis-pricing";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const input = matchSupportItemSchema.parse(await req.json());
    const result = await matchSupportItems(input);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}

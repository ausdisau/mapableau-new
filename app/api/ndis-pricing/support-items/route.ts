import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  searchSupportItems,
  toSupportItemSummary,
} from "@/lib/ndis-pricing/support-item-service";
import { supportItemSearchSchema } from "@/types/ndis-pricing";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = supportItemSearchSchema.parse(params);
    const { items, total, limit, offset } = await searchSupportItems(input);
    return jsonOk({
      items: items.map(toSupportItemSummary),
      total,
      limit,
      offset,
      disclaimer:
        "Support item data is from your uploaded catalogue. Not NDIA funding approval.",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}

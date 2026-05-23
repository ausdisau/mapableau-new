import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { runUnifiedSchedulingMatch } from "@/lib/matching/matching-service";

const bodySchema = z.object({
  careRequestId: z.string().optional(),
  transportBookingId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = bodySchema.parse(await req.json());
  if (!body.careRequestId && !body.transportBookingId) {
    return jsonError("careRequestId or transportBookingId required", 400);
  }

  const result = await runUnifiedSchedulingMatch({
    ...body,
    requestedById: user.id,
  });
  return jsonOk(result);
}

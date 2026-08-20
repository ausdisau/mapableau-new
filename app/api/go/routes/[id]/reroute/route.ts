import { z } from "zod";

import { mapableGoFlags, goFeatureDisabledResponse } from "@/lib/config/mapable-go";
import { getMobilityRoutingProfile } from "@/lib/go/profile-service";
import { reroutePlan } from "@/lib/go/route-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

const rerouteSchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!mapableGoFlags.participantRoutesEnabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = rerouteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const profile = await getMobilityRoutingProfile(user.id);
  const result = await reroutePlan({
    planId: id,
    userId: user.id,
    originLat: parsed.data.originLat,
    originLng: parsed.data.originLng,
    profile,
  });

  if (!result) return jsonError("Route plan not found", 404);

  return jsonOk({ planId: result.plan.id, ...result.response });
}

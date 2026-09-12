import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  goFeatureDisabledResponse,
  mapableGoFlags,
} from "@/lib/config/mapable-go";
import { planRouteRequestSchema } from "@/lib/go/contracts/route-contracts";
import {
  ensureAccessPassport,
  getMobilityRoutingProfile,
} from "@/lib/go/profile-service";
import { persistRoutePlan, planNavigateRoutes } from "@/lib/go/route-service";

export async function POST(req: Request) {
  if (!mapableGoFlags.participantRoutesEnabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = planRouteRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const passport = await ensureAccessPassport(user.id);
  const storedProfile = await getMobilityRoutingProfile(user.id);
  const profile = parsed.data.profile ?? storedProfile ?? undefined;

  const response = await planNavigateRoutes({
    ...parsed.data,
    profile,
  });

  const plan = await persistRoutePlan({
    userId: user.id,
    destinationPlaceId: parsed.data.destinationPlaceId,
    response,
    passportId: passport.id,
  });

  return jsonOk({ planId: plan.id, ...response });
}

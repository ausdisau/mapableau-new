import { z } from "zod";

import { mapableGoFlags, goFeatureDisabledResponse } from "@/lib/config/mapable-go";
import { planRouteRequestSchema } from "@/lib/go/contracts/route-contracts";
import { planNavigateRoutes } from "@/lib/go/route-service";
import { profileToConstraints, getMobilityRoutingProfile } from "@/lib/go/profile-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function POST(req: Request) {
  if (!mapableGoFlags.navigateApiEnabled) {
    return goFeatureDisabledResponse("MAPABLE_NAVIGATE_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = planRouteRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const storedProfile = await getMobilityRoutingProfile(user.id);
  const profile = parsed.data.profile ?? storedProfile ?? undefined;

  const response = await planNavigateRoutes({
    ...parsed.data,
    profile,
  });

  return jsonOk({
    ...response,
    constraintsApplied: profileToConstraints(profile),
  });
}

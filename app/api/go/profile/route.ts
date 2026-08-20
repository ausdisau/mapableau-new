import { mapableGoFlags, goFeatureDisabledResponse } from "@/lib/config/mapable-go";
import { mobilityRoutingProfileSchema } from "@/lib/go/contracts/route-contracts";
import {
  defaultPowerWheelchairProfile,
  getMobilityRoutingProfile,
  upsertMobilityRoutingProfile,
} from "@/lib/go/profile-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function GET() {
  if (!mapableGoFlags.enabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const profile =
    (await getMobilityRoutingProfile(user.id)) ?? defaultPowerWheelchairProfile();

  return jsonOk({ profile });
}

export async function PATCH(req: Request) {
  if (!mapableGoFlags.enabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = mobilityRoutingProfileSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  await upsertMobilityRoutingProfile(user.id, parsed.data);
  return jsonOk({ profile: parsed.data });
}

import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  HomeShortlistDisabledError,
  removePropertyFromShortlist,
} from "@/lib/home-living/discovery/shortlist-service";

type Params = Promise<{ propertyId: string }>;

export async function DELETE(
  _request: Request,
  context: { params: Params },
) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    return jsonError("Home shortlist is disabled", 404);
  }
  const { propertyId } = await context.params;
  try {
    await removePropertyFromShortlist({
      participantId: user.id,
      propertyId,
      actorUserId: user.id,
    });
    return jsonOk({ removed: true });
  } catch (error) {
    if (error instanceof HomeShortlistDisabledError) {
      return jsonError("Home shortlist is disabled", 404);
    }
    return jsonError("Unable to update shortlist", 500);
  }
}

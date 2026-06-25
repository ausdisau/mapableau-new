import { buildAccessibleDestinationProfile } from "@/lib/access-transport/accessible-destination-profile";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  const currentUser = user instanceof Response ? null : user;

  const { placeId } = await params;
  const profile = await buildAccessibleDestinationProfile({
    placeId,
    user: currentUser,
  });
  if (!profile) return jsonError("Place not found", 404);

  return jsonOk({ destinationProfile: profile });
}

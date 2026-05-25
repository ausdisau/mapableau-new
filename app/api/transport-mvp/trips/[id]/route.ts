import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canShareAccessibilityWithOrganisation } from "@/lib/consent/consent-service";
import { getTripForViewer } from "@/lib/transport-mvp/access-control";
import { getStopsForViewer } from "@/lib/transport-mvp/address-privacy";
import { buildAccessNeedsSummary } from "@/lib/transport-mvp/access-needs-summary";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await requireApiSession();
  if (sessionUser instanceof Response) return sessionUser;
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  try {
    const { trip, viewerRole, isParticipant } = await getTripForViewer(id, user);
    const stops = getStopsForViewer(trip.stops, viewerRole);
    const canViewDetail =
      isParticipant ||
      (await canShareAccessibilityWithOrganisation(
        trip.participantId,
        trip.organisationId,
        "transport"
      ));
    const accessNeedsSummary = buildAccessNeedsSummary(trip.accessNeeds, {
      canViewDetail,
    });

    return jsonOk({
      trip: {
        ...trip,
        stops,
        accessNeedsSummary,
        accessNeeds: canViewDetail ? trip.accessNeeds : null,
      },
      viewerRole,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Trip not found", 404);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Failed to load trip", 500);
  }
}

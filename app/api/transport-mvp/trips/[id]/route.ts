import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canShareAccessibilityWithOrganisation } from "@/lib/consent/consent-service";
import { buildAccessNeedsSummary } from "@/lib/transport-mvp/access-needs-summary";
import { getTripForViewer } from "@/lib/transport-mvp/access-control";
import { getStopsForViewer } from "@/lib/transport-mvp/address-privacy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

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

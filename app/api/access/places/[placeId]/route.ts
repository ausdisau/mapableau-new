import { getPlaceById, updateAccessPlace } from "@/lib/access-map/access-place-service";
import { canEditPlace } from "@/lib/access-map/access-place-policy";
import { confidenceLabel } from "@/lib/access-map/access-confidence-service";
import { getPublishedAssessmentForPlace } from "@/lib/access-accreditation/accreditation-assessment-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) return jsonError("Place not found", 404);

  const accreditation = await getPublishedAssessmentForPlace(placeId);

  return jsonOk({
    place: {
      id: place.id,
      name: place.name,
      category: place.category,
      description: place.description,
      addressText: place.addressText,
      suburb: place.suburb,
      stateOrRegion: place.stateOrRegion,
      country: place.country,
      confidence: place.confidence,
      confidenceLabel: confidenceLabel(place.confidence),
      sourceType: place.sourceType,
      features: place.features.map((f) => f.type),
      location: place.location,
      reviewCount: place._count.reviews,
      communityRatingSummaries: place.ratingSummaries,
      accreditation: accreditation
        ? {
            tier: accreditation.tier,
            totalScore: accreditation.totalScore,
            publishedAt: accreditation.publishedAt,
            expiresAt: accreditation.expiresAt,
          }
        : null,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canEditPlace(user)) return jsonError("Forbidden", 403);

  const { placeId } = await params;
  const body = await req.json();

  const place = await updateAccessPlace(placeId, body, user.id);
  return jsonOk({ place: { id: place.id, status: place.status } });
}

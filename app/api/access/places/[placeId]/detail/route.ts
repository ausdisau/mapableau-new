import { NextResponse } from "next/server";

import { countActiveAlertsForPlace } from "@/lib/access-alerts/access-alert-service";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import {
  formatDomainScoresForApi,
  getPlaceDomainSummaries,
} from "@/lib/access-reports/access-domain-service";
import { listActiveAlerts } from "@/lib/access-alerts/access-alert-service";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) return jsonError("Place not found", 404);

  const [domainScores, activeAlertCount, alerts] = await Promise.all([
    getPlaceDomainSummaries(placeId),
    countActiveAlertsForPlace(placeId),
    listActiveAlerts({ placeId }),
  ]);

  return jsonOk({
    place: {
      id: place.id,
      name: place.name,
      category: place.category,
      description: place.description,
      addressText: place.addressText,
      suburb: place.suburb,
      stateOrRegion: place.stateOrRegion,
      confidence: place.confidence,
      features: place.features.map((f) => f.type),
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      reviewCount: place._count.reviews,
      claimedByVenue: Boolean(place.venueProfile),
      accreditationTier: place.accreditationAssessments[0]?.tier ?? null,
      activeAlertCount,
      accessSummary: formatDomainScoresForApi(domainScores),
    },
    alerts: alerts.map((a) => ({
      id: a.id,
      alertType: a.alertType,
      title: a.title,
      description: a.description,
      status: a.status,
      expiresAt: a.expiresAt,
      createdAt: a.createdAt,
    })),
  });
}

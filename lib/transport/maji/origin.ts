import type { TransportTrip, TransportTripStop } from "@prisma/client";

import { majiConfig } from "@/lib/config/maji";
import { latestConsentedDriverOrigin } from "@/lib/transport/privacy/driver-location-share";
import type { JourneyOriginKind } from "@/types/maji";
import type { LatLng } from "@/types/transport-routing";

export type JourneyOrigin = {
  point: LatLng;
  kind: JourneyOriginKind;
  label: string;
};

function tripPickup(trip: Pick<TransportTrip, "pickupLat" | "pickupLng">): LatLng | null {
  if (trip.pickupLat == null || trip.pickupLng == null) return null;
  return { lat: trip.pickupLat, lng: trip.pickupLng };
}

function lastStopOrigin(
  stops: Array<Pick<TransportTripStop, "lat" | "lng" | "sequence">>
): LatLng | null {
  const withCoords = [...stops]
    .filter((stop) => stop.lat != null && stop.lng != null)
    .sort((a, b) => b.sequence - a.sequence);
  const last = withCoords[0];
  if (!last || last.lat == null || last.lng == null) return null;
  return { lat: last.lat, lng: last.lng };
}

export async function resolveJourneyOrigin(params: {
  trip: Pick<TransportTrip, "id" | "pickupLat" | "pickupLng">;
  stops?: Array<Pick<TransportTripStop, "lat" | "lng" | "sequence">>;
  syntheticOrigin?: LatLng;
}): Promise<JourneyOrigin | null> {
  const live = await latestConsentedDriverOrigin(params.trip.id);
  if (live) {
    return {
      point: live,
      kind: "live",
      label: "Consented in-service driver location",
    };
  }

  if (params.syntheticOrigin && majiConfig.syntheticPreviewEnabled) {
    return {
      point: params.syntheticOrigin,
      kind: "synthetic",
      label: "Synthetic preview origin",
    };
  }

  const checkpoint = lastStopOrigin(params.stops ?? []) ?? tripPickup(params.trip);
  if (!checkpoint) return null;
  return {
    point: checkpoint,
    kind: "synthetic",
    label: "Synthetic checkpoint (pickup or last trip stop). Not live GPS.",
  };
}

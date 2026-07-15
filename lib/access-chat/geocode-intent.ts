import { geocodeLocation } from "@/lib/agent/tools/geocode-location";
import type { AccessSearchIntent } from "@/types/access-chat";

/** Fill lat/lng when intent only has a suburb name. */
export async function geocodeIntentLocation(
  intent: AccessSearchIntent,
): Promise<AccessSearchIntent> {
  const loc = intent.location;
  if (!loc?.suburb) return intent;
  if (loc.lat != null && loc.lng != null) return intent;

  const geo = await geocodeLocation(loc.suburb);
  if (!geo.found || geo.lat == null || geo.lng == null) return intent;

  return {
    ...intent,
    location: {
      ...loc,
      lat: geo.lat,
      lng: geo.lng,
      radiusMeters: loc.radiusMeters ?? 3000,
    },
  };
}

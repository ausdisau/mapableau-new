import { googleForwardGeocode } from "@/lib/geocoding/google-geocoding-client";
import { isGoogleMapsConfigured } from "@/lib/geocoding/google-config";
import { prisma } from "@/lib/prisma";

export async function geocodeSuburbPostcode(
  suburb?: string,
  postcode?: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!suburb && !postcode) return null;

  try {
    const row = await prisma.searchableLocation.findFirst({
      where: {
        OR: [
          suburb ? { suburb: { equals: suburb, mode: "insensitive" } } : undefined,
          postcode ? { postcode } : undefined,
        ].filter(Boolean) as never[],
      },
    });

    if (row) {
      const parts = [row.suburb, row.state, row.postcode, row.country]
        .filter(Boolean)
        .join(" ");
      if (isGoogleMapsConfigured() && parts) {
        const geocoded = await googleForwardGeocode(parts);
        if (geocoded) {
          return { lat: geocoded.lat, lng: geocoded.lng };
        }
      }
    }
  } catch {
    // fall through to forward geocode
  }

  if (isGoogleMapsConfigured()) {
    const address = [suburb, postcode, "Australia"].filter(Boolean).join(" ");
    try {
      const geocoded = await googleForwardGeocode(address);
      if (geocoded) {
        return { lat: geocoded.lat, lng: geocoded.lng };
      }
    } catch (err) {
      console.error("[geocoding-service] Google forward geocode failed", err);
    }
  }

  return null;
}

import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { accessExperienceFlags } from "@/lib/access/experience/flags";
import { listPublishedPlaces } from "@/lib/access/map/access-place-service";

export const metadata = {
  title: "MapAble Access | Accessibility map",
  description:
    "Search accessible places with community reviews, confidence labels, and MapAble accreditation. List view works without map scripts.",
};

export default async function AccessPage() {
  const places = await listPublishedPlaces(200);
  const v2 = accessExperienceFlags.enabled;

  return (
    <MapAbleAccessShell
      experienceV2={v2}
      initialPlaces={places.map((place) => ({
        id: place.id,
        name: place.name,
        category: place.category,
        suburb: place.suburb,
        stateOrRegion: place.stateOrRegion,
        addressText: place.addressText,
        confidence: place.confidence,
        sourceType: place.sourceType,
        updatedAt: place.updatedAt.toISOString(),
        reviewCount: place._count.reviews,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        features: place.features.map((f) => ({ type: f.type })),
      }))}
    />
  );
}

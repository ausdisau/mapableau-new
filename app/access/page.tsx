import { AccessExplorationShell } from "@/components/access/AccessExplorationShell";
import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { isClientAccessExperienceV2Enabled } from "@/lib/access/experience/flags";
import { listAccessExplorationDtos } from "@/lib/access/experience/load-access-exploration";
import { listPublishedPlaces } from "@/lib/access/map/access-place-service";

export const metadata = {
  title: "MapAble Access | Accessibility map",
  description:
    "Search accessible places with functional access requirements, AccessFit, evidence provenance, and MapLibre map/list discovery.",
};

export default async function AccessPage() {
  const v2Enabled = isClientAccessExperienceV2Enabled();

  if (v2Enabled) {
    const places = await listAccessExplorationDtos(200);
    return <AccessExplorationShell initialPlaces={places} />;
  }

  const places = await listPublishedPlaces(200);
  return (
    <MapAbleAccessShell
      initialPlaces={places.map((place) => ({
        id: place.id,
        name: place.name,
        category: place.category,
        suburb: place.suburb,
        reviewCount: place._count.reviews,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
      }))}
    />
  );
}

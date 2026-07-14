import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { listPublishedPlaces } from "@/lib/access-map/access-place-service";

export const metadata = {
  title: "MapAble Access | Accessibility map",
  description:
    "Browse MapAble Access places on a map. Rate accessibility, leave comments, verify information, and plan accessible transport.",
};

export default async function AccessPage() {
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

import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { listPublishedPlaces } from "@/lib/access-map/access-place-service";

export const metadata = {
  title: "MapAble Access | Accessibility map",
  description:
    "Search accessible venues, read community reviews, and explore indoor floor plans where available.",
};

export default async function AccessPage() {
  const places = await listPublishedPlaces(100);

  const initialPlaces = places.map((place) => ({
    id: place.id,
    name: place.name,
    category: place.category,
    suburb: place.suburb,
    reviewCount: place._count.reviews,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
  }));

  return <MapAbleAccessShell initialPlaces={initialPlaces} />;
}

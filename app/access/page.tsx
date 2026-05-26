import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { listPublishedPlaces } from "@/lib/access-map/access-place-service";

export default async function AccessPage() {
  const places = await listPublishedPlaces(100);

  const initial = places.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    suburb: p.suburb,
    reviewCount: p._count.reviews,
    latitude: p.location?.latitude,
    longitude: p.location?.longitude,
  }));

  return <MapAbleAccessShell initialPlaces={initial} />;
}

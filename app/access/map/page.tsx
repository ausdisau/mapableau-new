import Link from "next/link";

import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { listPublishedPlaces } from "@/lib/access-map/access-place-service";

export default async function AccessMapPage() {
  const places = await listPublishedPlaces(100);

  const initialPlaces = places.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    suburb: p.suburb,
    reviewCount: p._count.reviews,
    latitude: p.location?.latitude,
    longitude: p.location?.longitude,
  }));

  return (
    <div>
      <MapAbleAccessShell initialPlaces={initialPlaces} />
      <div className="mx-auto max-w-6xl px-4 pb-8">
        <Link href="/access/add-place" className="text-sm underline">
          Suggest a new place
        </Link>
      </div>
    </div>
  );
}

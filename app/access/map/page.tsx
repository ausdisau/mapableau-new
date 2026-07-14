import { MapAbleAccessShell } from "@/components/access/MapAbleAccessShell";
import { MapProvider } from "@/components/map/MapProvider";
import { searchAccessPlaces } from "@/lib/access-map/access-search-service";

export const metadata = {
  title: "Access map | MapAble Access",
  description:
    "Browse MapAble Access places on a map. Rate accessibility, leave comments, verify information, and plan accessible transport.",
};

export const dynamic = "force-dynamic";

export default async function AccessMapPage() {
  let initialPlaces: {
    id: string;
    name: string;
    category: string;
    suburb?: string | null;
    reviewCount?: number;
    latitude?: number;
    longitude?: number;
  }[] = [];

  try {
    const results = await searchAccessPlaces({
      limit: 50,
      sort: "relevance",
      features: undefined,
    });
    initialPlaces = results.map((r) => ({
      id: r.place.id,
      name: r.place.name,
      category: r.place.category,
      suburb: r.place.suburb,
      reviewCount: r.place._count.reviews,
      latitude: r.place.location?.latitude,
      longitude: r.place.location?.longitude,
    }));
  } catch {
    initialPlaces = [];
  }

  return (
    <MapProvider>
      <MapAbleAccessShell initialPlaces={initialPlaces} />
    </MapProvider>
  );
}

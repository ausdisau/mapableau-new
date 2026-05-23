import { notFound } from "next/navigation";

import { OSM_ATTRIBUTION } from "@/lib/map/osm-attribution";
import { prisma } from "@/lib/prisma";

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = await prisma.accessiblePlace.findUnique({
    where: { id },
    include: { features: true, reviews: { take: 5 } },
  });
  if (!place) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">{place.name}</h1>
      {place.address ? <p className="text-muted-foreground">{place.address}</p> : null}
      <p className="text-sm">
        Confidence: {place.confidence.replace(/_/g, " ")} — not a guarantee of access.
      </p>
      <ul className="list-disc pl-5">
        {place.features.map((f) => (
          <li key={f.id}>{f.type.replace(/_/g, " ")}</li>
        ))}
      </ul>
      <footer className="text-xs text-muted-foreground">{OSM_ATTRIBUTION}</footer>
    </main>
  );
}

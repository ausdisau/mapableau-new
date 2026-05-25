import Link from "next/link";

import { AccessFloorPlanViewer } from "@/components/access-intelligence/AccessFloorPlanViewer";
import {
  floorPlanAssetUrl,
  getPublishedFloorPlan,
} from "@/lib/access-intelligence/floor-plan-service";
import { getPlaceById } from "@/lib/access-map/access-place-service";

export default async function PublicAccessFloorPlanPage({
  params,
}: {
  params: Promise<{ placeId: string; floorPlanId: string }>;
}) {
  const { placeId, floorPlanId } = await params;
  const [place, floorPlan] = await Promise.all([
    getPlaceById(placeId, true),
    getPublishedFloorPlan({ placeId, floorPlanId }),
  ]);

  if (!place || !floorPlan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>Floor plan not found.</p>
        <Link href={`/access/places/${placeId}`} className="underline">
          Back to venue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Link href={`/access/places/${placeId}`} className="text-sm underline">
        Back to {place.name}
      </Link>
      <AccessFloorPlanViewer
        floorPlan={{
          title: floorPlan.title,
          levelLabel: floorPlan.levelLabel,
          assetUrl: floorPlanAssetUrl(floorPlan),
          mimeType: floorPlan.mimeType,
          altText: floorPlan.altText,
          publicNotes: floorPlan.publicNotes,
          markers: floorPlan.markers.map((marker) => ({
            id: marker.id,
            type: marker.type,
            title: marker.title,
            description: marker.description,
            xPercent: marker.xPercent,
            yPercent: marker.yPercent,
            confidence: marker.confidence,
            severity: marker.severity,
          })),
        }}
      />
    </div>
  );
}

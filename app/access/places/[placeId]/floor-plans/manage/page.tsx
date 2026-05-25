import Link from "next/link";
import { redirect } from "next/navigation";

import { FloorPlanMarkerEditor } from "@/components/access-intelligence/FloorPlanMarkerEditor";
import { FloorPlanUploadForm } from "@/components/access-intelligence/FloorPlanUploadForm";
import {
  floorPlanAssetUrl,
  listFloorPlansForAuthoring,
} from "@/lib/access-intelligence/floor-plan-service";
import { canManagePlaceFloorPlans } from "@/lib/access-intelligence/floor-plan-policy";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { requireAuth } from "@/lib/auth/guards";

export default async function ManageVenueFloorPlansPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const user = await requireAuth();
  const { placeId } = await params;
  const [place, canManage] = await Promise.all([
    getPlaceById(placeId, false),
    canManagePlaceFloorPlans(user, placeId),
  ]);

  if (!place) redirect("/access");
  if (!canManage) redirect(`/access/places/${placeId}/claim`);

  const floorPlans = await listFloorPlansForAuthoring(placeId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <Link href={`/access/places/${placeId}`} className="text-sm underline">
          Back to {place.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Manage Access Intelligence floor plans
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload floor plans, add markers, and publish information that helps
          visitors plan access before arrival.
        </p>
      </div>

      <FloorPlanUploadForm placeId={placeId} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Draft and published plans</h2>
        {floorPlans.length ? (
          floorPlans.map((floorPlan) => (
            <FloorPlanMarkerEditor
              key={floorPlan.id}
              placeId={placeId}
              floorPlan={{
                id: floorPlan.id,
                title: floorPlan.title,
                status: floorPlan.status,
                assetUrl: floorPlanAssetUrl(floorPlan),
                mimeType: floorPlan.mimeType,
                altText: floorPlan.altText,
                markers: floorPlan.markers.map((marker) => ({
                  id: marker.id,
                  type: marker.type,
                  title: marker.title,
                  description: marker.description,
                  xPercent: marker.xPercent,
                  yPercent: marker.yPercent,
                  confidence: marker.confidence,
                  severity: marker.severity,
                  sortOrder: marker.sortOrder,
                })),
              }}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No floor plans yet. Upload a draft to start adding markers.
          </p>
        )}
      </section>
    </div>
  );
}

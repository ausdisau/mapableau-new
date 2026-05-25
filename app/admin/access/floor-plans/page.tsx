import Link from "next/link";

import { FloorPlanMarkerEditor } from "@/components/access-intelligence/FloorPlanMarkerEditor";
import { FloorPlanUploadForm } from "@/components/access-intelligence/FloorPlanUploadForm";
import { floorPlanAssetUrl } from "@/lib/access-intelligence/floor-plan-service";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessFloorPlansPage() {
  await requireAdmin();

  const [places, floorPlans] = await Promise.all([
    prisma.accessPlace.findMany({
      where: { status: "published" },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true },
    }),
    prisma.accessFloorPlan.findMany({
      where: { status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        place: { select: { id: true, name: true } },
        markers: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    }),
  ]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <Link href="/admin/access" className="text-sm underline">
          Back to Access admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Access Intelligence floor plans
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload floor-plan images or PDFs, place access markers, and publish
          them to public venue profiles.
        </p>
      </div>

      <FloorPlanUploadForm placeOptions={places} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent floor plans</h2>
        {floorPlans.length ? (
          <div className="space-y-4">
            {floorPlans.map((floorPlan) => (
              <div key={floorPlan.id} className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Venue:{" "}
                  <Link
                    href={`/access/places/${floorPlan.place.id}`}
                    className="underline"
                  >
                    {floorPlan.place.name}
                  </Link>
                </p>
                <FloorPlanMarkerEditor
                  placeId={floorPlan.placeId}
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
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No floor plans have been uploaded yet.
          </p>
        )}
      </section>
    </div>
  );
}

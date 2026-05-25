import { getFloorPlanAsset } from "@/lib/access-intelligence/floor-plan-service";
import { jsonError } from "@/lib/api/response";
import { readAccessMediaFile } from "@/lib/storage/access-media";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string; floorPlanId: string }> },
) {
  const { placeId, floorPlanId } = await params;
  const floorPlan = await getFloorPlanAsset({ placeId, floorPlanId });
  if (!floorPlan) return jsonError("Floor plan not found", 404);

  if (floorPlan.publicUrl) {
    return Response.redirect(floorPlan.publicUrl, 302);
  }

  const file = await readAccessMediaFile(floorPlan.storagePath);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": floorPlan.mimeType,
      "Content-Disposition": `inline; filename="${floorPlan.title.replace(/"/g, "")}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}

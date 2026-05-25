import {
  createFloorPlan,
  floorPlanAssetUrl,
  listPublishedFloorPlansForPlace,
} from "@/lib/access-intelligence/floor-plan-service";
import {
  canManagePlaceFloorPlans,
  floorPlanSourceTypeForUser,
} from "@/lib/access-intelligence/floor-plan-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { saveAccessMediaFile } from "@/lib/storage/access-media";
import { floorPlanMetadataSchema } from "@/lib/validation/access-floor-plan";

const MAX_FLOOR_PLAN_UPLOAD_BYTES = 8 * 1024 * 1024;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  const floorPlans = await listPublishedFloorPlansForPlace(placeId);

  return jsonOk({
    floorPlans: floorPlans.map((floorPlan) => ({
      ...floorPlan,
      assetUrl: floorPlanAssetUrl(floorPlan),
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  if (!(await canManagePlaceFloorPlans(user, placeId))) {
    return jsonError("Forbidden", 403);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("multipart/form-data required", 415);
  }

  const uploadLength = req.headers.get("content-length");
  if (uploadLength == null) {
    return jsonError("Content-Length required for floor-plan uploads", 411);
  }
  const uploadBytes = Number(uploadLength);
  if (
    !Number.isFinite(uploadBytes) ||
    uploadBytes < 0 ||
    uploadBytes > MAX_FLOOR_PLAN_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES
  ) {
    return jsonError("Request body too large", 413);
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError("file required", 400);
  }
  if (file.size > MAX_FLOOR_PLAN_UPLOAD_BYTES) {
    return jsonError("File too large", 413);
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return jsonError("Unsupported floor-plan file type", 415);
  }

  const metadata = floorPlanMetadataSchema.safeParse({
    title: form.get("title"),
    levelLabel: form.get("levelLabel") || undefined,
    altText: form.get("altText"),
    publicNotes: form.get("publicNotes") || undefined,
    width: form.get("width") || undefined,
    height: form.get("height") || undefined,
  });
  if (!metadata.success) return zodErrorResponse(metadata.error);

  const storagePath = await saveAccessMediaFile({
    buffer: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
    prefix: "floorplans",
  });

  const floorPlan = await createFloorPlan({
    placeId,
    uploadedById: user.id,
    sourceType: floorPlanSourceTypeForUser(user),
    metadata: metadata.data,
    storagePath,
    mimeType: file.type,
  });

  return jsonOk(
    { floorPlan: { ...floorPlan, assetUrl: floorPlanAssetUrl(floorPlan) } },
    201,
  );
}

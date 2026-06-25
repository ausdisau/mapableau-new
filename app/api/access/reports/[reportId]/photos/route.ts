import { saveAccessMediaFile } from "@/lib/storage/access-media";
import { addReportPhoto } from "@/lib/access-reports/access-report-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { reportId } = await params;
  const formData = await req.formData();
  const file = formData.get("photo");
  const altText = String(formData.get("altText") ?? "").trim();
  const consent = formData.get("consent") === "true";

  if (!consent) {
    return jsonError("Photo consent is required", 400);
  }
  if (!altText || altText.length < 5) {
    return jsonError("Alt text is required (min 5 characters)", 400);
  }
  if (!(file instanceof File)) {
    return jsonError("Photo file is required", 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError("Unsupported image type", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("Photo too large (max 5MB)", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = await saveAccessMediaFile({
    buffer,
    mimeType: file.type,
    prefix: "reviews",
    originalName: file.name,
  });

  try {
    const photo = await addReportPhoto({
      reportId,
      userId: user.id,
      storagePath,
      mimeType: file.type,
      altText,
    });
    return jsonOk({ photo: { id: photo.id, storagePath: photo.storagePath } }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "REPORT_NOT_FOUND") return jsonError("Report not found", 404);
    if (msg === "REPORT_FORBIDDEN") return jsonError("Forbidden", 403);
    throw e;
  }
}

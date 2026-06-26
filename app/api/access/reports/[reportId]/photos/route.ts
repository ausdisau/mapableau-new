import { uploadReviewPhoto } from "@/lib/storage/access-media-upload";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { reportId } = await params;
  const formData = await req.formData();
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "");
  const consent = formData.get("photoConsent") === "true";

  if (!consent) {
    return jsonError(
      "You must confirm the photo does not show identifiable people",
      400
    );
  }
  if (!(file instanceof File)) {
    return jsonError("Photo file required", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const photo = await uploadReviewPhoto({
      reviewId: reportId,
      buffer,
      mimeType: file.type || "image/jpeg",
      altText,
      uploadedById: user.id,
    });
    return jsonOk({ photo: { id: photo.id, status: photo.status } }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALT_TEXT_REQUIRED") {
      return jsonError("Alt text is required — describe the access feature, not people", 400);
    }
    if (msg === "INVALID_FILE_TYPE") {
      return jsonError("Only JPEG, PNG, or WebP images are allowed", 400);
    }
    if (msg === "FILE_TOO_LARGE") {
      return jsonError("Photo must be under 5 MB", 400);
    }
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "REVIEW_NOT_FOUND") return jsonError("Report not found", 404);
    throw e;
  }
}

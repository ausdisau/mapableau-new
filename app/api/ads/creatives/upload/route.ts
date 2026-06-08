import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  AD_CREATIVE_MIME_TYPES,
  storeAdCreativeFile,
  adCreativePublicUrl,
} from "@/lib/storage/ad-creatives";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("file is required", 400);
  }

  const mimeType = file.type || "application/octet-stream";
  if (!AD_CREATIVE_MIME_TYPES.includes(mimeType as (typeof AD_CREATIVE_MIME_TYPES)[number])) {
    return jsonError("Unsupported file type. Use PNG, JPEG, or WebP.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const stored = await storeAdCreativeFile(buffer, file.name, mimeType);
    return jsonOk({
      fileKey: stored.fileKey,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      url: adCreativePublicUrl(stored.fileKey),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return jsonError(message, 400);
  }
}

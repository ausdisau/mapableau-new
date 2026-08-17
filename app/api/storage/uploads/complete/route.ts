import { z } from "zod";

import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { storageErrorResponse } from "@/lib/storage/http";
import { completeUpload } from "@/lib/storage/upload-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(64),
  completionNonce: z.string().min(16).max(128),
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
});

/**
 * POST /api/storage/uploads/complete
 * Replay-resistant completion after the browser PUT to object storage.
 */
export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!accessInfrastructureFlags.evidenceUploadsEnabled) {
    return jsonError("Access evidence uploads are disabled", 404);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await completeUpload({
      actor: user,
      sessionId: parsed.data.sessionId,
      completionNonce: parsed.data.completionNonce,
      sha256: parsed.data.sha256,
    });
    return jsonOk({
      ...result,
      claimState: "in_development",
    });
  } catch (err) {
    return storageErrorResponse(err);
  }
}

import { z } from "zod";

import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { storageErrorResponse } from "@/lib/storage/http";
import { incrementStorageMetric } from "@/lib/storage/metrics";
import { authoriseUpload } from "@/lib/storage/upload-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  purpose: z.literal("access_evidence_photo"),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  originalFilename: z.string().min(1).max(200),
  placeId: z.string().min(8).max(64),
  observationId: z.string().min(8).max(64),
  classification: z.enum(["PUBLIC", "AUTHENTICATED"]).optional(),
});

/**
 * POST /api/storage/uploads
 * Request a signed direct-upload grant. Client cannot choose bucket/path.
 */
export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const ip = getClientIp(request);
  if (!checkIpRateLimit(`storage-upload:${user.id}:${ip}`, { windowMs: 60_000, max: 10 })) {
    return jsonError("Too many upload requests", 429);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (
    parsed.data.purpose === "access_evidence_photo" &&
    !accessInfrastructureFlags.evidenceUploadsEnabled
  ) {
    return jsonError("Access evidence uploads are disabled", 404);
  }

  try {
    const result = await authoriseUpload({
      actor: user,
      ...parsed.data,
    });
    return jsonOk(
      {
        sessionId: result.sessionId,
        assetId: result.assetId,
        completionNonce: result.completionNonce,
        uploadUrl: result.grant.uploadUrl,
        method: result.grant.method,
        headers: result.grant.headers,
        expiresAt: result.grant.expiresAt.toISOString(),
        acceptedTypes: result.acceptedTypes,
        maxBytes: result.maxBytes,
        productionClaim: result.productionClaim,
        claimState: "in_development",
      },
      201,
    );
  } catch (err) {
    incrementStorageMetric("uploads_failed", {
      purpose: parsed.data.purpose,
      errorClass: "authorise",
    });
    return storageErrorResponse(err);
  }
}

import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { storageErrorResponse } from "@/lib/storage/http";
import {
  deleteStoredAsset,
  getAssetForActor,
  toPublicAsset,
} from "@/lib/storage/upload-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/storage/assets/:id
 * Metadata only — never returns credentials, object keys, or file bytes.
 */
export async function GET(_request: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!accessInfrastructureFlags.evidenceUploadsEnabled) {
    return jsonError("Access evidence uploads are disabled", 404);
  }

  try {
    const { id } = await context.params;
    const asset = await getAssetForActor(id, user);
    return jsonOk({
      asset: toPublicAsset(asset),
      productionClaim: "none",
      claimState: "in_development",
    });
  } catch (err) {
    return storageErrorResponse(err);
  }
}

/**
 * DELETE /api/storage/assets/:id
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!accessInfrastructureFlags.evidenceUploadsEnabled) {
    return jsonError("Access evidence uploads are disabled", 404);
  }

  try {
    const { id } = await context.params;
    const result = await deleteStoredAsset(id, user);
    return jsonOk({ ...result, claimState: "in_development" });
  } catch (err) {
    return storageErrorResponse(err);
  }
}

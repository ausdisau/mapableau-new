import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { storageErrorResponse } from "@/lib/storage/http";
import { createAssetReadUrl } from "@/lib/storage/upload-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/storage/assets/:id/read-url
 * Authorise first, then issue a short-lived signed read URL.
 */
export async function POST(_request: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!accessInfrastructureFlags.evidenceUploadsEnabled) {
    return jsonError("Access evidence uploads are disabled", 404);
  }

  try {
    const { id } = await context.params;
    const result = await createAssetReadUrl(id, user);
    return jsonOk({ ...result, claimState: "in_development" });
  } catch (err) {
    return storageErrorResponse(err);
  }
}

import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import {
  getCivicAsset,
  serializeCivicAsset,
} from "@/lib/civic-access/assets/asset-registry-service";
import { mapCivicError, requireCivicFlag } from "@/lib/civic-access/http";
import { hasCivicCapability } from "@/lib/civic-access/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  const disabled = requireCivicFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasCivicCapability(user, "assets:read")) {
    return apiForbidden();
  }

  try {
    const { assetId } = await context.params;
    const asset = await getCivicAsset(assetId);
    return Response.json({ asset: serializeCivicAsset(asset) });
  } catch (error) {
    return mapCivicError(error);
  }
}

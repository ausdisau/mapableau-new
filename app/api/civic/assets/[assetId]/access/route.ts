import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import { projectStaticAccessibility } from "@/lib/civic-access/assets/static-projection-service";
import { mapCivicError, requireCivicFlag } from "@/lib/civic-access/http";
import { hasCivicCapability } from "@/lib/civic-access/permissions";

/**
 * Static accessibility projection for a Civic asset.
 * Does not expose participant journeys or personal fit.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  const disabled = requireCivicFlag("assetRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasCivicCapability(user, "projection:read")) {
    return apiForbidden();
  }

  try {
    const { assetId } = await context.params;
    const projection = await projectStaticAccessibility(assetId);
    return Response.json({ projection });
  } catch (error) {
    return mapCivicError(error);
  }
}

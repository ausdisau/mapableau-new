import { jsonError, jsonOk } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import {
  resolveActorTenantId,
  resolveCoverageCareProviderAdmin,
} from "@/lib/coverage-care/demo-actor";
import { runProvisioningPreview } from "@/lib/coverage-care/provisioning-service";

export async function POST(request: Request) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) return jsonError("Unauthorized", 401);

  try {
    const checks = runProvisioningPreview({
      actor,
      actorTenantId: resolveActorTenantId(
        request.headers.get("x-mapable-tenant-id"),
      ),
    });
    return jsonOk({ checks });
  } catch (error) {
    return mapCoverageCareError(error);
  }
}

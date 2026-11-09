import { jsonError, jsonOk } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import {
  resolveActorTenantId,
  resolveCoverageCareProviderAdmin,
} from "@/lib/coverage-care/demo-actor";
import { listProviderInbox } from "@/lib/coverage-care/enquiry-service";

export async function GET(request: Request) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) return jsonError("Unauthorized", 401);

  try {
    const tenantHeader = request.headers.get("x-mapable-tenant-id");
    const enquiries = listProviderInbox({
      actor,
      actorTenantId: resolveActorTenantId(tenantHeader),
    });
    return jsonOk({ enquiries });
  } catch (error) {
    return mapCoverageCareError(error);
  }
}

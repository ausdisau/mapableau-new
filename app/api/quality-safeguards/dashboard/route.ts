import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireQsCapability } from "@/lib/quality-safeguards/capabilities";
import { getQsDashboard } from "@/lib/quality-safeguards/dashboard-service";
import { isQualitySafeguardsOpsEnabled } from "@/lib/quality-safeguards/feature-flags";

export async function GET(req: Request) {
  if (!isQualitySafeguardsOpsEnabled()) {
    return jsonError("Quality & Safeguards Ops Centre is disabled", 404);
  }

  const user = await requireApiAdminScope("qs:ops:read");
  if (user instanceof Response) return user;

  const capability = await requireQsCapability(user, "qs_ops_read");
  if (capability instanceof Response) return capability;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");

  const dashboard = await getQsDashboard({
    organisationId: organisationId || undefined,
  });

  return jsonOk(dashboard);
}

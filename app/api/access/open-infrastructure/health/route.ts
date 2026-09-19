import { getOpenInfrastructureFlagMatrix } from "@/lib/integrations/access/flags";
import { healthCheckAllAccessProviders } from "@/lib/integrations/access/registry";
import "@/lib/integrations/access";
import { jsonOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const flags = getOpenInfrastructureFlagMatrix();
  const providers = flags.enabled ? await healthCheckAllAccessProviders() : [];
  return jsonOk({
    status: flags.enabled ? "open_infrastructure_enabled" : "disabled",
    flags,
    providers,
    checkedAt: new Date().toISOString(),
  });
}

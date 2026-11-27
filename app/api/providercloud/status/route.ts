import { jsonOk } from "@/lib/api/response";
import { buildProviderCloudStatus } from "@/lib/providercloud/status";

export async function GET() {
  return jsonOk({
    status: buildProviderCloudStatus(),
  });
}

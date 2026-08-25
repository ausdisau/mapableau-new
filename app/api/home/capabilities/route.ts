import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  mapableHomeDisabledResponse,
  mapableHomeFlags,
} from "@/lib/config/mapable-home";
import { listHomeCapabilities } from "@/lib/home/core/capability-registry";

export async function GET() {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    return mapableHomeDisabledResponse("MAPABLE_HOME_ENV_SIMULATOR_ENABLED");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  return jsonOk({
    simulation: true,
    capabilities: listHomeCapabilities(),
  });
}

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { collectY1WedgePilotMetrics } from "@/lib/pilot/y1-wedge-metrics-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (user.primaryRole !== "mapable_admin") {
    return jsonError("Forbidden", 403);
  }

  const metrics = await collectY1WedgePilotMetrics();
  return jsonOk(metrics);
}

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listActiveAlerts } from "@/lib/emergency/alert-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("emergency:read:self");
  if (user instanceof Response) return user;
  const region = new URL(req.url).searchParams.get("regionCode") ?? undefined;
  const alerts = await listActiveAlerts(region);
  return jsonOk({ alerts });
}

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listServiceGapsForAdmin } from "@/lib/unmet-needs/service-gap-aggregation-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const gaps = await listServiceGapsForAdmin();
  return jsonOk({ gaps });
}

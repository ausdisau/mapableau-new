import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { refreshUnmetNeedAggregates } from "@/lib/unmet-needs/service-gap-aggregation-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  await refreshUnmetNeedAggregates();
  const { listServiceGapsForAdmin } = await import(
    "@/lib/unmet-needs/service-gap-aggregation-service"
  );
  const aggregates = await listServiceGapsForAdmin();
  return jsonOk({ aggregates });
}

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listReportDefinitions } from "@/lib/reports/report-definition-service";

export async function GET() {
  const user = await requireApiPermission("reporting:manage");
  if (user instanceof Response) return user;

  const definitions = await listReportDefinitions();
  return jsonOk({ definitions });
}

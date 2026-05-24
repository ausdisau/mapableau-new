import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCoordinatorCaseload } from "@/lib/support-coordination/support-coordination-service";

export async function GET() {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  const caseload = await getCoordinatorCaseload(user.id);
  return jsonOk({ caseload });
}

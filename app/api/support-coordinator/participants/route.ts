import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listCoordinatorCaseload } from "@/lib/care-support/coordination-service";

export async function GET() {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  try {
    const participants = await listCoordinatorCaseload(user.id);
    return jsonOk({ participants });
  } catch {
    return jsonError("Failed to load caseload", 500);
  }
}

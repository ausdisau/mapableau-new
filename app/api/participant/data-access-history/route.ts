import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getParticipantDataAccessHistory } from "@/lib/audit/data-access-log-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (user.primaryRole !== "participant") {
    return jsonError("Forbidden", 403);
  }

  const logs = await getParticipantDataAccessHistory(user.id);
  return jsonOk({ logs });
}

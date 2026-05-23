import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listServiceLogsForParticipant } from "@/lib/service-logs/service-log-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const logs = await listServiceLogsForParticipant(user.id);
  return jsonOk(logs);
}

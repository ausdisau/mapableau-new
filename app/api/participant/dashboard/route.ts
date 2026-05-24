import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getParticipantDashboard } from "@/lib/participant/participant-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const dashboard = await getParticipantDashboard(user.id);
  return jsonOk({ dashboard });
}

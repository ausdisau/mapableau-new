import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listServiceHistory } from "@/lib/participant/participant-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const history = await listServiceHistory(user.id);
  return jsonOk({ history });
}

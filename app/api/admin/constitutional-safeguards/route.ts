import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listActiveSafeguards } from "@/lib/constitutional-safeguards/safeguards-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ articles: await listActiveSafeguards() });
}

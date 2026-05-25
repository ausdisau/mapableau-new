import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { runCapacityMatch } from "@/lib/capacity/capacity-matching-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const result = await runCapacityMatch(body.waitlistId);
  return jsonOk(result);
}

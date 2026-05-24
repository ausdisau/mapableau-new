import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listVerifiedTherapists } from "@/lib/moves/moves-access";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const therapyType = url.searchParams.get("therapyType") ?? undefined;
  const therapists = await listVerifiedTherapists({ therapyType });
  return jsonOk({ therapists });
}

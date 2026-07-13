import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listScenarioSummaries } from "@/lib/care-intelligence/scenarios";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  return jsonOk({ scenarios: listScenarioSummaries() });
}

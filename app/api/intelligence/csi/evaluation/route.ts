import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  careIntelligenceConfigFromEnv,
  careIntelligenceHealth,
} from "@/lib/care-intelligence/config";
import { evaluateCareIntelligence } from "@/lib/care-intelligence/evaluation";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const config = careIntelligenceConfigFromEnv();
  const health = careIntelligenceHealth(config);
  if (health.status !== "ready")
    return jsonError(`CSI lab ${health.status}`, 503);
  return jsonOk({ evaluation: evaluateCareIntelligence(config) });
}

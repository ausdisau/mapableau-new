import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { expireDueAgreements } from "@/lib/service-agreements/lifecycle-service";

function authorizedByCronToken(req: Request) {
  const token = process.env.SERVICE_AGREEMENTS_CRON_TOKEN;
  if (!token) return false;
  return req.headers.get("x-service-agreements-token") === token;
}

export async function POST(req: Request) {
  const admin = await requireApiAdmin();
  const cronAuthorized = authorizedByCronToken(req);
  if (admin instanceof Response && !cronAuthorized) return admin;

  const expired = await expireDueAgreements({
    actorUserId: admin instanceof Response ? undefined : admin.id,
    source: cronAuthorized ? "job" : "manual",
  });
  return jsonOk({ expiredCount: expired.length, agreements: expired });
}

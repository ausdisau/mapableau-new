import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getConnectAccountStatus } from "@/lib/billing-core/connect-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const status = await getConnectAccountStatus(user.id, "provider");
    if (!status.ok) return jsonError("Could not load Connect status", 503);
    return jsonOk(status);
  } catch {
    return jsonError("Could not load Connect status", 503);
  }
}

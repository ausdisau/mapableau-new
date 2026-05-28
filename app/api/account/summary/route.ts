import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { buildAccountSummary } from "@/lib/account/account-summary-service";

export async function GET() {
  const user = await requireApiPermission("account:read:self");
  if (user instanceof Response) return user;

  const summary = await buildAccountSummary(user);
  return jsonOk(summary);
}

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getBillingAccountSummary } from "@/lib/billing-core/entitlements";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const roleParam = url.searchParams.get("role");
  const role = roleParam === "employer" ? "employer" : "provider";

  const summary = await getBillingAccountSummary(user.id, role);
  return jsonOk({ role, ...summary });
}

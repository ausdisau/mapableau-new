import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { applyLaunchGovernanceDeferrals } from "@/lib/platform-gaps/launch-governance-presets";

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const overrides = await applyLaunchGovernanceDeferrals(user.id);
  return jsonOk({ applied: overrides.length, overrides });
}

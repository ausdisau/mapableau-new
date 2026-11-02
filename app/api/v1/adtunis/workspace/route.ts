
import { getWorkspace } from "@/lib/adtunis/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { adtunisConfig } from "@/lib/config/adtunis";
import { AdtunisActionError } from "@mapable/adtunis-core";

export async function GET() {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const workspace = await getWorkspace(user.id);
    return jsonOk(workspace);
  } catch (error) {
    if (error instanceof AdtunisActionError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Unable to load Adtunis workspace.", 500);
  }
}

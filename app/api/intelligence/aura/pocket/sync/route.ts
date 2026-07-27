import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAuraDisabledResponse } from "@/lib/aura/feature-flags";
import { processSyncQueue } from "@/lib/aura/pocket/sync";

export const runtime = "nodejs";

export async function POST() {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const result = processSyncQueue({
      userId: user.id,
      rejectOfflineExecutionApproval: true,
    });
    return jsonOk(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return jsonError(message, 400);
  }
}

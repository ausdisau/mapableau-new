import { jsonError, jsonOk } from "@/lib/api/response";
import { declineWorkerInvitation } from "@/lib/workers/worker-invitation-service";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const { token } = await context.params;
  const result = await declineWorkerInvitation(token);
  if ("error" in result) {
    return jsonError(result.error ?? "Could not decline invitation", 400);
  }
  return jsonOk({ declined: true });
}

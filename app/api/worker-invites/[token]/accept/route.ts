import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { acceptWorkerInvitation } from "@/lib/workers/worker-invitation-service";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { token } = await context.params;
  const body = await req.json().catch(() => ({}));
  const displayName =
    typeof body.displayName === "string" ? body.displayName : user.name;

  const result = await acceptWorkerInvitation({
    token,
    userId: user.id,
    displayName,
  });

  if ("error" in result) {
    return jsonError(result.error ?? "Could not accept invitation", 400);
  }

  return jsonOk({
    profile: result.profile,
    providerId: result.providerId,
  });
}

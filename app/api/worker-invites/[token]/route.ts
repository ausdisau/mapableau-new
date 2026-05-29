import { jsonError, jsonOk } from "@/lib/api/response";
import { getInvitationByToken } from "@/lib/workers/worker-invitation-service";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { token } = await context.params;
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return jsonError("Invitation not found", 404);
  }

  return jsonOk({
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    provider: invitation.provider,
    organisation: invitation.organisation,
    email: invitation.email,
  });
}

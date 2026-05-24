import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { getParticipantForNominee } from "@/lib/family/nominee-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const data = await getParticipantForNominee({
      nomineeId: user.id,
      participantId: id,
    });
    return jsonOk(data);
  } catch (e) {
    if (e instanceof Error && e.message === "NO_LINK") {
      return jsonError(accessDeniedMessage("no_link"), 403);
    }
    return jsonError("Could not load participant", 400);
  }
}

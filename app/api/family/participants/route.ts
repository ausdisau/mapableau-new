import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canAccessFamilyPortal } from "@/lib/access/role-policy";
import { listLinkedParticipantsForNominee } from "@/lib/family/nominee-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!canAccessFamilyPortal(user.primaryRole)) {
    return jsonError("Access denied", 403);
  }

  const participants = await listLinkedParticipantsForNominee(user.id);
  return jsonOk({ participants });
}

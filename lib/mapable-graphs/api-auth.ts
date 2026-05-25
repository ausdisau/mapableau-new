import { requireApiSession } from "@/lib/api/auth-handler";
import { canViewParticipantProfile } from "@/lib/auth/permissions";
import { apiForbidden } from "@/lib/auth/guards";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function requireGraphParticipantAccess(
  participantId: string
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (
    !canViewParticipantProfile(
      user.primaryRole,
      user.id,
      participantId
    )
  ) {
    return apiForbidden();
  }
  return user;
}

import type { CurrentUser } from "@/lib/auth/current-user";
import { checkConsent } from "@/lib/consent/consent-service";

export async function canViewParticipantOutcomes(
  viewer: CurrentUser,
  participantId: string
): Promise<boolean> {
  if (viewer.id === participantId) return true;
  if (viewer.primaryRole === "mapable_admin") return true;
  const allowed = await checkConsent({
    subjectUserId: participantId,
    grantedToUserId: viewer.id,
    scope: "support_coordination.access",
  });
  return allowed;
}

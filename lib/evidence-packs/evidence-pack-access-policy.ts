import type { CurrentUser } from "@/lib/auth/current-user";
import { checkConsent } from "@/lib/consent/consent-service";

export async function canAccessEvidencePack(
  viewer: CurrentUser,
  pack: { participantId: string; createdById: string | null }
): Promise<boolean> {
  if (viewer.id === pack.participantId) return true;
  if (viewer.primaryRole === "mapable_admin") return true;
  if (pack.createdById === viewer.id) return true;
  return checkConsent({
    subjectUserId: pack.participantId,
    grantedToUserId: viewer.id,
    scope: "support_coordination.access",
  });
}

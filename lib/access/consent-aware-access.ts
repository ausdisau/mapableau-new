import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { hasPlatformConsentScope } from "@/lib/db/platform-consent-service";
import type { PlatformConsentScope } from "@/types/consent";

export async function requireConsentScope(params: {
  actor: CurrentUser;
  subjectProfileId: string;
  scope: PlatformConsentScope;
  grantedToProfileId?: string;
  grantedToOrganisationId?: string;
}): Promise<boolean> {
  if (params.actor.id === params.subjectProfileId) return true;
  if (isAdminRole(params.actor.primaryRole)) return true;

  return hasPlatformConsentScope({
    subjectProfileId: params.subjectProfileId,
    scope: params.scope,
    grantedToProfileId:
      params.grantedToProfileId ?? params.actor.id,
    grantedToOrganisationId: params.grantedToOrganisationId,
  });
}

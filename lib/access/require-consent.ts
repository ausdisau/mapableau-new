import { checkConsent } from "@/lib/consent/consent-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden } from "@/lib/auth/guards";
import type { ConsentScope } from "@/types/mapable";

export async function requireConsentForSubject(params: {
  actor: CurrentUser;
  subjectUserId: string;
  scope: ConsentScope;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
}): Promise<Response | null> {
  const ok = await checkConsent({
    subjectUserId: params.subjectUserId,
    scope: params.scope,
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
  });
  if (!ok) {
    return apiForbidden("Consent required for this access");
  }
  return null;
}

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";

export class NdiaClaimAuthorityError extends Error {
  readonly code:
    | "FORBIDDEN_ORG"
    | "CONSENT_OR_LAWFUL_AUTHORITY_REQUIRED"
    | "CROSS_TENANT_DENIED";

  constructor(
    code: NdiaClaimAuthorityError["code"],
    message: string,
  ) {
    super(message);
    this.name = "NdiaClaimAuthorityError";
    this.code = code;
  }
}

export async function assertOrganisationAuthorised(
  user: CurrentUser,
  organisationId: string,
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new NdiaClaimAuthorityError(
      "FORBIDDEN_ORG",
      "User is not authorised for this organisation",
    );
  }
}

export async function assertNotCrossTenant(
  claimOrganisationId: string,
  requestedOrganisationId: string,
): Promise<void> {
  if (claimOrganisationId !== requestedOrganisationId) {
    throw new NdiaClaimAuthorityError(
      "CROSS_TENANT_DENIED",
      "Cross-tenant NDIA claim access is denied",
    );
  }
}

/**
 * Before exposing minimised claim payload beyond the creating org boundary,
 * require active consent or an explicit lawful-authority attestation from the caller.
 * Does not grant NDIA submission rights.
 */
export async function assertConsentOrLawfulAuthority(params: {
  participantUserId: string;
  actorUserId: string;
  organisationId: string;
  lawfulAuthorityAttested?: boolean;
}): Promise<"consent" | "lawful_authority"> {
  if (params.lawfulAuthorityAttested === true) {
    return "lawful_authority";
  }

  const allowed = await checkConsent({
    subjectUserId: params.participantUserId,
    scope: "billing.read",
    grantedToOrganisationId: params.organisationId,
  });

  if (!allowed) {
    throw new NdiaClaimAuthorityError(
      "CONSENT_OR_LAWFUL_AUTHORITY_REQUIRED",
      "Participant billing consent or other lawful authority is required",
    );
  }

  return "consent";
}

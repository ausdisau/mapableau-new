import { getDbClient } from "@/lib/db/db-client";

export async function userBelongsToOrganisation(
  profileId: string,
  organisationId: string
): Promise<boolean> {
  const member = await getDbClient().organisationMember.findUnique({
    where: {
      userId_organisationId: { userId: profileId, organisationId },
    },
  });
  return Boolean(member);
}

export async function requireOrganisationAccess(
  profileId: string,
  organisationId: string
): Promise<void> {
  const ok = await userBelongsToOrganisation(profileId, organisationId);
  if (!ok) {
    const { AccessDeniedError } = await import("@/lib/errors/access-errors");
    throw new AccessDeniedError();
  }
}

import { prisma } from "@/lib/prisma";

/**
 * Cross-tenant disclosure helper.
 *
 * Wave 8's Organisation.id tenant boundary is unchanged. This helper
 * exists so that the disclosure gateway can *record* that a payload
 * crossed a tenant boundary — it never bypasses the tenant boundary.
 * A cross-tenant disclosure requires the same directive + receipt as any
 * other disclosure; the fact that the recipient is a different tenant is
 * additional metadata that the gateway records.
 */
export async function isCrossTenantDisclosure(input: {
  subjectId: string;
  recipientOrganisationId: string | null;
}): Promise<boolean> {
  if (!input.recipientOrganisationId) return true;
  const participant = await prisma.user.findUnique({
    where: { id: input.subjectId },
    select: {
      organisationMemberships: {
        select: { organisationId: true },
        take: 1,
      },
    },
  });
  const homeOrg =
    participant?.organisationMemberships?.[0]?.organisationId ?? null;
  if (!homeOrg) return true;
  return homeOrg !== input.recipientOrganisationId;
}

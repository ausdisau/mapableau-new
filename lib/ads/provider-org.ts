import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function getDefaultProviderOrganisationId(
  preferredOrgId?: string
): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  if (preferredOrgId) {
    const member = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: user.id,
          organisationId: preferredOrgId,
        },
      },
    });
    if (member) return preferredOrgId;
  }

  const first = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return first?.organisationId ?? null;
}

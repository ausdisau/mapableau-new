import { prisma } from "@/lib/prisma";

export async function resolveXeroContactId(params: {
  participantId: string;
  organisationId?: string | null;
  contactName: string;
}) {
  const participantLink = await prisma.xeroContactLink.findUnique({
    where: { participantId: params.participantId },
  });
  if (participantLink) return participantLink.xeroContactId;

  if (params.organisationId) {
    const orgLink = await prisma.xeroContactLink.findUnique({
      where: { organisationId: params.organisationId },
    });
    if (orgLink) return orgLink.xeroContactId;
  }

  return undefined;
}

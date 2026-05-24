import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function canEditClinicalNotes(
  actor: CurrentUser,
  authorUserId?: string,
): Promise<boolean> {
  if (isAdminRole(actor.primaryRole)) return true;
  if (authorUserId && actor.id === authorUserId) {
    const therapist = await prisma.therapistProfile.findFirst({
      where: { userId: actor.id, credentialStatus: "verified" },
    });
    return Boolean(therapist);
  }
  const therapist = await prisma.therapistProfile.findFirst({
    where: { userId: actor.id, credentialStatus: "verified" },
  });
  return Boolean(therapist);
}

export async function canViewClinicalNotes(actor: CurrentUser): Promise<boolean> {
  return canEditClinicalNotes(actor);
}

export async function listVerifiedTherapists(opts?: {
  therapyType?: string;
  deliveryMode?: string;
}) {
  return prisma.therapistProfile.findMany({
    where: {
      active: true,
      credentialStatus: "verified",
      ...(opts?.therapyType
        ? { therapyTypes: { has: opts.therapyType as never } }
        : {}),
    },
    include: { services: true },
    take: 30,
  });
}

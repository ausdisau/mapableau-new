import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function addEmergencyContact(
  participantId: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    relationship?: string;
    isPrimary?: boolean;
    notifyOnNeedHelp?: boolean;
  },
  actorUserId: string,
) {
  const profile = await prisma.emergencyProfile.findUnique({
    where: { participantId },
  });

  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { participantId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.emergencyContact.create({
    data: {
      participantId,
      profileId: profile?.id,
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      relationship: data.relationship,
      isPrimary: data.isPrimary ?? false,
      notifyOnNeedHelp: data.notifyOnNeedHelp ?? true,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "emergency.contact.added",
    entityType: "EmergencyContact",
    entityId: contact.id,
    participantId,
  });

  return contact;
}

export async function deleteEmergencyContact(
  contactId: string,
  participantId: string,
  actorUserId: string,
) {
  const deleted = await prisma.emergencyContact.deleteMany({
    where: { id: contactId, participantId },
  });
  if (deleted.count === 0) throw new Error("NOT_FOUND");

  await createAuditEvent({
    actorUserId,
    action: "emergency.contact.removed",
    entityType: "EmergencyContact",
    entityId: contactId,
    participantId,
  });
}

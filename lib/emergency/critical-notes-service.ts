import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listCriticalNotes(participantId: string) {
  return prisma.criticalAccessNote.findMany({
    where: { participantId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createCriticalNote(
  participantId: string,
  data: { category?: string; title: string; content: string },
  actorUserId: string,
) {
  const note = await prisma.criticalAccessNote.create({
    data: {
      participantId,
      category: data.category ?? "general",
      title: data.title,
      content: data.content,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "emergency.critical_note.created",
    entityType: "CriticalAccessNote",
    entityId: note.id,
    participantId,
  });

  return note;
}

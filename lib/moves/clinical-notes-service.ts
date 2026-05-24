import type { CurrentUser } from "@/lib/auth/current-user";

import { prisma } from "@/lib/prisma";
import { canEditClinicalNotes } from "@/lib/moves/moves-access";
import { logClinicalAudit } from "@/lib/moves/clinical-audit";

export async function createProgressNote(params: {
  therapyAppointmentId: string;
  author: CurrentUser;
  clinicalContent: string;
  participantSummary: string;
}) {
  const allowed = await canEditClinicalNotes(params.author);
  if (!allowed) throw new Error("CLINICAL_ACCESS_DENIED");

  const appt = await prisma.therapyAppointment.findUniqueOrThrow({
    where: { id: params.therapyAppointmentId },
  });

  const note = await prisma.progressNote.create({
    data: {
      therapyAppointmentId: params.therapyAppointmentId,
      authorUserId: params.author.id,
      clinicalContent: params.clinicalContent,
    },
  });

  await prisma.participantProgressSummary.create({
    data: {
      therapyAppointmentId: params.therapyAppointmentId,
      participantId: appt.participantId,
      plainLanguageSummary: params.participantSummary,
      createdByUserId: params.author.id,
    },
  });

  await logClinicalAudit({
    entityType: "ProgressNote",
    entityId: note.id,
    action: "created",
    actorUserId: params.author.id,
  });

  return note;
}

export async function getClinicalNoteForTherapist(
  noteId: string,
  actor: CurrentUser,
) {
  const allowed = await canViewClinicalNotes(actor);
  if (!allowed) throw new Error("CLINICAL_ACCESS_DENIED");
  return prisma.progressNote.findUnique({ where: { id: noteId } });
}

async function canViewClinicalNotes(actor: CurrentUser) {
  return canEditClinicalNotes(actor);
}

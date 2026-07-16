import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createDecisionRoom(params: {
  subjectUserId: string;
  title: string;
  question: string;
  values?: string[];
  constraints?: string[];
  options: Array<{ label: string; description?: string }>;
}) {
  const room = await prisma.decisionRoom.create({
    data: {
      subjectUserId: params.subjectUserId,
      title: params.title,
      question: params.question,
      valuesJson: params.values ?? [],
      constraintsJson: params.constraints ?? [],
      status: "open",
      options: {
        create: params.options.map((o, i) => ({
          label: o.label,
          description: o.description,
          sortOrder: i,
        })),
      },
    },
    include: { options: true },
  });

  await createAuditEvent({
    actorUserId: params.subjectUserId,
    action: "rights.decision_room_opened",
    entityType: "DecisionRoom",
    entityId: room.id,
    participantId: params.subjectUserId,
  });

  return room;
}

export async function inviteSupporter(params: {
  roomId: string;
  supporterUserId: string;
  authorityScope: string;
  actorUserId: string;
}) {
  const room = await prisma.decisionRoom.findUnique({
    where: { id: params.roomId },
  });
  if (!room || room.subjectUserId !== params.actorUserId) {
    throw new Error("FORBIDDEN");
  }

  const supporter = await prisma.decisionSupporter.create({
    data: {
      roomId: params.roomId,
      supporterUserId: params.supporterUserId,
      authorityScope: params.authorityScope,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "rights.supporter_invited",
    entityType: "DecisionSupporter",
    entityId: supporter.id,
    participantId: room.subjectUserId,
    metadata: { scope: params.authorityScope },
  });

  return supporter;
}

export async function addSupporterContribution(params: {
  supporterId: string;
  content: string;
  actorUserId: string;
}) {
  const supporter = await prisma.decisionSupporter.findUnique({
    where: { id: params.supporterId },
    include: { room: true },
  });
  if (!supporter || supporter.supporterUserId !== params.actorUserId) {
    throw new Error("FORBIDDEN");
  }

  return prisma.decisionSupporterContribution.create({
    data: {
      supporterId: params.supporterId,
      content: params.content,
    },
  });
}

export async function recordDissent(params: {
  roomId: string;
  supporterId: string;
  content: string;
  actorUserId: string;
}) {
  const supporter = await prisma.decisionSupporter.findUnique({
    where: { id: params.supporterId },
  });
  if (!supporter || supporter.supporterUserId !== params.actorUserId) {
    throw new Error("FORBIDDEN");
  }

  const dissent = await prisma.decisionDissent.create({
    data: {
      roomId: params.roomId,
      supporterId: params.supporterId,
      content: params.content,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "rights.supporter_dissent_recorded",
    entityType: "DecisionDissent",
    entityId: dissent.id,
    participantId: (await prisma.decisionRoom.findUnique({ where: { id: params.roomId } }))?.subjectUserId,
  });

  return dissent;
}

export async function recordParticipantDecision(params: {
  roomId: string;
  participantWording: string;
  chosenOptionId?: string;
  reflection?: string;
  actorUserId: string;
}) {
  const room = await prisma.decisionRoom.findUnique({
    where: { id: params.roomId },
  });
  if (!room || room.subjectUserId !== params.actorUserId) {
    throw new Error("FORBIDDEN");
  }

  const record = await prisma.decisionRecord.create({
    data: {
      roomId: params.roomId,
      participantWording: params.participantWording,
      chosenOptionId: params.chosenOptionId,
      reflection: params.reflection,
    },
  });

  await prisma.decisionAttestation.create({
    data: {
      recordId: record.id,
      attestationType: "participant_made_decision",
      actorUserId: params.actorUserId,
    },
  });

  await prisma.decisionRoom.update({
    where: { id: params.roomId },
    data: { status: "decided" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "rights.participant_decision_recorded",
    entityType: "DecisionRecord",
    entityId: record.id,
    participantId: room.subjectUserId,
  });

  return record;
}

export async function getDecisionRoom(roomId: string, subjectUserId: string) {
  const room = await prisma.decisionRoom.findFirst({
    where: { id: roomId, subjectUserId },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      supporters: {
        include: { contributions: true, dissents: true },
      },
      evidence: true,
      records: { include: { attestations: true } },
      dissents: true,
    },
  });
  return room;
}

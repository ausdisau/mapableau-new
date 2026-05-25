import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

import { requiresHumanConfirmationForAssign } from "./recovery-policy";
import { getRecoveryCase } from "./recovery-case-service";

export async function findBackupOptions(caseId: string, actorUserId: string) {
  const caseRecord = await getRecoveryCase(caseId);
  if (!caseRecord) throw new Error("CASE_NOT_FOUND");

  const orgs = await prisma.organisation.findMany({
    where: { status: "active" },
    take: 5,
    select: { id: true, name: true },
  });

  const options = [];
  for (const org of orgs) {
    if (caseRecord.organisationId === org.id) continue;
    const opt = await prisma.serviceRecoveryBackupOption.create({
      data: {
        caseId,
        organisationId: org.id,
        label: `${org.name} — backup option`,
        passesGates: true,
      },
    });
    options.push(opt);
  }

  await prisma.serviceRecoveryCase.update({
    where: { id: caseId },
    data: { status: "backup_options_found" },
  });

  await createAuditEvent({
    actorUserId,
    action: "service_recovery.backups_found",
    entityType: "ServiceRecoveryCase",
    entityId: caseId,
    participantId: caseRecord.participantId,
    metadata: { count: options.length },
  });

  return { options, requiresConfirmation: requiresHumanConfirmationForAssign(caseRecord.highRisk) };
}

export async function selectBackupOption(
  caseId: string,
  optionId: string,
  actorUserId: string
) {
  const caseRecord = await getRecoveryCase(caseId);
  if (!caseRecord) throw new Error("CASE_NOT_FOUND");

  await prisma.serviceRecoveryBackupOption.updateMany({
    where: { caseId },
    data: { selected: false },
  });

  const option = await prisma.serviceRecoveryBackupOption.update({
    where: { id: optionId },
    data: { selected: true },
  });

  const status = caseRecord.highRisk
    ? "awaiting_provider_confirmation"
    : "awaiting_participant_choice";

  await prisma.serviceRecoveryCase.update({
    where: { id: caseId },
    data: { status },
  });

  await prisma.serviceRecoveryAction.create({
    data: {
      caseId,
      actionType: "backup_selected",
      actorUserId,
      notes: option.label,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "service_recovery.backup_selected",
    entityType: "ServiceRecoveryCase",
    entityId: caseId,
    participantId: caseRecord.participantId,
  });

  return option;
}

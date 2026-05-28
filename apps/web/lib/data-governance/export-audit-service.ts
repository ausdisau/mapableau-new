import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function logExportRequest(input: {
  requestedBy: string;
  purpose: string;
  rowCount: number;
}) {
  const exp = await prisma.dataExport.create({
    data: {
      requestedBy: input.requestedBy,
      purpose: input.purpose,
      status: "completed",
    },
  });

  await prisma.dataExportEvent.create({
    data: {
      exportId: exp.id,
      eventType: "export_completed",
    },
  });

  await createAuditEvent({
    actorUserId: input.requestedBy,
    action: "data:export",
    entityType: "DataExport",
    entityId: exp.id,
    metadata: { purpose: input.purpose, rowCount: input.rowCount },
  });

  return exp;
}

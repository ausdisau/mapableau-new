import type { PrivacyIncidentType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function createPrivacyIncident(params: {
  type: PrivacyIncidentType;
  summary: string;
  reportedBy: string;
  affectedUserIds?: string[];
}) {
  if (!remainingSystemsConfig.privacyGovernanceEnabled) {
    throw new Error("PRIVACY_GOVERNANCE_DISABLED");
  }

  const incident = await prisma.privacyIncident.create({
    data: {
      type: params.type,
      summary: params.summary,
      reportedBy: params.reportedBy,
      events: {
        create: {
          action: "created",
          actorId: params.reportedBy,
          notes: params.summary,
        },
      },
      subjects: {
        create:
          params.affectedUserIds?.map((userId) => ({ userId })) ?? [],
      },
    },
    include: { events: true, subjects: true },
  });

  await createAuditEvent({
    actorUserId: params.reportedBy,
    action: "privacy.incident_created",
    entityType: "PrivacyIncident",
    entityId: incident.id,
  });

  return incident;
}

export async function listPrivacyIncidents() {
  return prisma.privacyIncident.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      events: { orderBy: { createdAt: "asc" }, take: 20 },
      actions: true,
    },
    take: 50,
  });
}

export async function addIncidentAction(
  incidentId: string,
  action: string,
  owner?: string
) {
  return prisma.privacyIncidentAction.create({
    data: { incidentId, action, owner },
  });
}

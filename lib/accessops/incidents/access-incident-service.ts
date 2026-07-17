import type {
  AccessEvidenceLevel,
  AccessIncidentCategory,
  AccessIncidentState,
  AccessOpsIncident,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertIncidentTransition } from "./incident-state-machine";

export async function openAccessIncident(input: {
  assetId: string;
  category: AccessIncidentCategory;
  title: string;
  safeDescription: string;
  sourceType: string;
  evidenceLevel?: AccessEvidenceLevel;
  reporterOpaqueRef?: string | null;
}): Promise<AccessOpsIncident> {
  return prisma.accessOpsIncident.create({
    data: {
      assetId: input.assetId,
      category: input.category,
      title: input.title,
      safeDescription: input.safeDescription,
      sourceType: input.sourceType,
      evidenceLevel: input.evidenceLevel ?? "community_observed",
      reporterOpaqueRef: input.reporterOpaqueRef ?? null,
    },
  });
}

export async function transitionAccessIncident(
  incidentId: string,
  to: AccessIncidentState,
  evidenceRef?: string,
): Promise<AccessOpsIncident> {
  const incident = await prisma.accessOpsIncident.findUniqueOrThrow({
    where: { id: incidentId },
  });
  assertIncidentTransition(incident.state, to);
  if (to === "closed" && !evidenceRef && !incident.restorationEvidenceRef) {
    throw new Error("INCIDENT_CLOSURE_REQUIRES_EVIDENCE");
  }
  return prisma.accessOpsIncident.update({
    where: { id: incidentId },
    data: {
      state: to,
      restorationEvidenceRef: evidenceRef ?? incident.restorationEvidenceRef,
      acknowledgedAt:
        to === "acknowledged" ? new Date() : incident.acknowledgedAt,
      restoredAt: to === "restored" ? new Date() : incident.restoredAt,
      closedAt: to === "closed" ? new Date() : incident.closedAt,
    },
  });
}

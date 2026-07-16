import type { PilotReportabilityState } from "@prisma/client";

import { assertReportabilityTransition } from "@/lib/pilot/incidents/reportability-assessment";
import { prisma } from "@/lib/prisma";

/**
 * Links an existing IncidentReport to a ControlledPilot.
 * Does not create a second incident system.
 */
export async function linkIncidentToPilot(input: {
  incidentId: string;
  pilotId: string;
}) {
  const [incident, pilot] = await Promise.all([
    prisma.incidentReport.findUniqueOrThrow({ where: { id: input.incidentId } }),
    prisma.controlledPilot.findUniqueOrThrow({ where: { id: input.pilotId } }),
  ]);
  if (
    incident.organisationId &&
    incident.organisationId !== pilot.organisationId
  ) {
    throw new Error("INCIDENT_ORG_MISMATCH");
  }

  return prisma.incidentReport.update({
    where: { id: input.incidentId },
    data: {
      pilotId: input.pilotId,
      reportabilityState: incident.reportabilityState ?? "not_assessed",
    },
  });
}

export async function updateIncidentReportability(input: {
  incidentId: string;
  toState: PilotReportabilityState;
  actorUserId: string;
}) {
  const incident = await prisma.incidentReport.findUniqueOrThrow({
    where: { id: input.incidentId },
  });
  if (!incident.pilotId) {
    throw new Error("INCIDENT_NOT_LINKED_TO_PILOT");
  }
  const from = incident.reportabilityState ?? "not_assessed";
  assertReportabilityTransition(from, input.toState);

  return prisma.incidentReport.update({
    where: { id: input.incidentId },
    data: { reportabilityState: input.toState },
  });
}

export async function listPilotIncidents(pilotId: string) {
  return prisma.incidentReport.findMany({
    where: { pilotId },
    orderBy: { createdAt: "desc" },
  });
}

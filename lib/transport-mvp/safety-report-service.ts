import type { IncidentSeverity } from "@prisma/client";

import { createIncident, submitIncident } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";

export async function reportTransportSafetyIssue(params: {
  reportedById: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  tripId?: string;
  participantId?: string;
  organisationId?: string;
  immediateRiskPresent?: boolean;
}) {
  let tripParticipantId = params.participantId;
  let tripOrgId = params.organisationId;

  if (params.tripId) {
    const trip = await prisma.transportTrip.findUnique({
      where: { id: params.tripId },
      include: { dispatch: true },
    });
    if (!trip) throw new Error("NOT_FOUND");
    tripParticipantId = trip.participantId;
    tripOrgId = trip.organisationId;
  }

  const incident = await createIncident({
    category: "unsafe_transport",
    severity: params.severity,
    title: params.title,
    description: params.description,
    reportedById: params.reportedById,
    participantId: tripParticipantId,
    organisationId: tripOrgId,
    immediateRiskPresent: params.immediateRiskPresent ?? params.severity === "critical",
    possibleReportableIncident: params.severity === "critical",
    safeguardingConcern: params.severity === "critical",
  });

  if (params.tripId) {
    await prisma.transportIncidentLink.create({
      data: { tripId: params.tripId, incidentId: incident.id },
    });
  }

  await submitIncident(incident.id, params.reportedById);

  return incident;
}

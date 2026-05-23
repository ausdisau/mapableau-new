import { prisma } from "@/lib/prisma";

export async function canMatchParticipant(participantId: string): Promise<{
  allowed: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];
  const openIncidents = await prisma.incidentReport.count({
    where: {
      participantId,
      status: { in: ["submitted", "triage", "under_review", "escalated"] },
    },
  });
  if (openIncidents > 0) {
    reasons.push("Open safeguarding incidents require review before matching.");
    return { allowed: false, reasons };
  }
  return { allowed: true, reasons };
}

export async function canDispatchTrip(input: {
  participantId: string;
  driverId?: string;
  vehicleId?: string;
}): Promise<{ allowed: boolean; reasons: string[] }> {
  const match = await canMatchParticipant(input.participantId);
  if (!match.allowed) return match;
  if (!input.driverId || !input.vehicleId) {
    return {
      allowed: false,
      reasons: ["Driver and vehicle must be assigned before dispatch."],
    };
  }
  return { allowed: true, reasons: [] };
}

export async function listComplianceSummaryForAdmin() {
  const [consents, incidents, openTickets] = await Promise.all([
    prisma.consentRecord.count({ where: { status: "active" } }),
    prisma.incidentReport.count({
      where: { status: { notIn: ["closed", "resolved"] } },
    }),
    prisma.supportTicket.count({ where: { status: "open" } }),
  ]);
  return { consents, incidents, openTickets };
}

import { prisma } from "@/lib/prisma";

/**
 * Links an existing Complaint to a ControlledPilot.
 * Does not create a second complaint system.
 */
export async function linkComplaintToPilot(input: {
  complaintId: string;
  pilotId: string;
}) {
  const [complaint, pilot] = await Promise.all([
    prisma.complaint.findUniqueOrThrow({ where: { id: input.complaintId } }),
    prisma.controlledPilot.findUniqueOrThrow({ where: { id: input.pilotId } }),
  ]);
  if (
    complaint.organisationId &&
    complaint.organisationId !== pilot.organisationId
  ) {
    throw new Error("COMPLAINT_ORG_MISMATCH");
  }

  return prisma.complaint.update({
    where: { id: input.complaintId },
    data: { pilotId: input.pilotId },
  });
}

export async function listPilotComplaints(pilotId: string) {
  return prisma.complaint.findMany({
    where: { pilotId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markComplaintAnonymous(complaintId: string) {
  return prisma.complaint.update({
    where: { id: complaintId },
    data: { anonymous: true },
  });
}

import { prisma } from "@/lib/prisma";

export async function getPilotIncidentTimeline(pilotId: string) {
  const incidents = await prisma.incidentReport.findMany({
    where: { pilotId },
    orderBy: { createdAt: "asc" },
    include: {
      updates: { orderBy: { createdAt: "asc" } },
      actions: { orderBy: { createdAt: "asc" } },
    },
  });

  return incidents.map((inc) => ({
    incidentId: inc.id,
    title: inc.title,
    status: inc.status,
    severity: inc.severity,
    reportabilityState: inc.reportabilityState,
    createdAt: inc.createdAt.toISOString(),
    events: [
      ...inc.updates.map((u) => ({
        kind: "update" as const,
        at: u.createdAt.toISOString(),
        body: u.body,
      })),
      ...inc.actions.map((a) => ({
        kind: "action" as const,
        at: a.createdAt.toISOString(),
        body: a.actionType,
      })),
    ].sort((a, b) => a.at.localeCompare(b.at)),
  }));
}

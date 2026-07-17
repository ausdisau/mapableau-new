import { prisma } from "@/lib/prisma";

export type ActionQueueItem = {
  kind: "signal" | "corrective_action" | "change_request" | "enrolment";
  id: string;
  title: string;
  priority: number;
};

export async function buildPilotActionQueue(
  pilotId: string
): Promise<ActionQueueItem[]> {
  const [signals, actions, changes, pendingEnrolments] = await Promise.all([
    prisma.pilotSafetySignal.findMany({
      where: { pilotId, acknowledged: false },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
    prisma.pilotCorrectiveAction.findMany({
      where: { pilotId, status: { in: ["open", "in_progress"] } },
      take: 50,
    }),
    prisma.pilotChangeRequest.findMany({
      where: { pilotId, status: { in: ["submitted", "approved"] } },
      take: 20,
    }),
    prisma.pilotParticipantEnrolment.findMany({
      where: { pilotId, status: { in: ["invited", "consent_pending"] } },
      take: 50,
    }),
  ]);

  const items: ActionQueueItem[] = [];
  for (const s of signals) {
    items.push({
      kind: "signal",
      id: s.id,
      title: s.summary,
      priority: s.severity === "critical" ? 1 : 2,
    });
  }
  for (const a of actions) {
    items.push({
      kind: "corrective_action",
      id: a.id,
      title: a.title,
      priority: 2,
    });
  }
  for (const c of changes) {
    items.push({
      kind: "change_request",
      id: c.id,
      title: c.title,
      priority: 3,
    });
  }
  for (const e of pendingEnrolments) {
    items.push({
      kind: "enrolment",
      id: e.id,
      title: `Enrolment ${e.status}`,
      priority: 4,
    });
  }
  return items.sort((a, b) => a.priority - b.priority);
}

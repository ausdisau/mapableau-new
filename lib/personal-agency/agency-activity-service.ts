import { prisma } from "@/lib/prisma";

/** Participant-facing activity derived from existing AuditEvent rows. */
export type AgencyActivityItem = {
  id: string;
  occurredAt: string;
  title: string;
  summary: string;
  initiator: "you" | "mapable" | "system";
  shared: string[];
  approvedBy: string | null;
  reversible: boolean;
};

const PAI_ACTION_PREFIXES = [
  "PAI_",
  "GO_",
  "consent.",
  "accessibility.",
] as const;

function mapActionToActivity(
  action: string,
  metadata: Record<string, unknown> | null,
): Pick<AgencyActivityItem, "title" | "summary" | "initiator" | "shared" | "approvedBy" | "reversible"> {
  switch (action) {
    case "PAI_LIFE_INTENT_CREATED":
      return {
        title: "You added something that matters",
        summary: "Saved to My Life. Your original words were kept.",
        initiator: "you",
        shared: [],
        approvedBy: null,
        reversible: true,
      };
    case "PAI_LIFE_INTENT_UPDATED":
      return {
        title: "You updated a life intent",
        summary: "Changes were saved to My Life.",
        initiator: "you",
        shared: [],
        approvedBy: null,
        reversible: true,
      };
    case "PAI_LIFE_INTENT_EXPLORATION_SAVED":
      return {
        title: "You saved an exploration step",
        summary:
          typeof metadata?.label === "string"
            ? `Saved: ${metadata.label}`
            : "Saved a next step for later.",
        initiator: "you",
        shared: [],
        approvedBy: null,
        reversible: true,
      };
    case "PAI_SETUP_COMPLETED":
      return {
        title: "You completed My MapAble setup",
        summary: "Preferences saved. You can change them anytime.",
        initiator: "you",
        shared: [],
        approvedBy: null,
        reversible: true,
      };
    case "GO_ROUTE_REQUESTED":
      return {
        title: "MapAble searched route options",
        summary: "No personal information was shared.",
        initiator: "mapable",
        shared: [],
        approvedBy: null,
        reversible: false,
      };
    case "consent.granted":
      return {
        title: "You granted consent",
        summary: "Recorded in your privacy history.",
        initiator: "you",
        shared: [],
        approvedBy: "you",
        reversible: true,
      };
    case "consent.revoked":
      return {
        title: "You revoked consent",
        summary: "Access was withdrawn.",
        initiator: "you",
        shared: [],
        approvedBy: "you",
        reversible: false,
      };
    default:
      return {
        title: "Activity recorded",
        summary: action.replace(/[._]/g, " "),
        initiator: "system",
        shared: [],
        approvedBy: null,
        reversible: false,
      };
  }
}

function isParticipantRelevantAction(action: string): boolean {
  return PAI_ACTION_PREFIXES.some((prefix) => action.startsWith(prefix));
}

export async function listAgencyActivityForParticipant(
  participantId: string,
  limit = 50,
): Promise<AgencyActivityItem[]> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      OR: [{ participantId }, { actorUserId: participantId }],
    },
    orderBy: { createdAt: "desc" },
    take: limit * 2,
  });

  return rows
    .filter((row) => isParticipantRelevantAction(row.action))
    .slice(0, limit)
    .map((row) => {
      const meta =
        row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null;
      const mapped = mapActionToActivity(row.action, meta);
      return {
        id: row.id,
        occurredAt: row.createdAt.toISOString(),
        ...mapped,
      };
    });
}

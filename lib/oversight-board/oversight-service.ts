import { phase10Config } from "@/lib/config/phase10";
import { prisma } from "@/lib/prisma";

export async function scheduleOversightMeeting(params: {
  title: string;
  summary: string;
  meetingAt?: Date;
}) {
  if (!phase10Config.oversightBoardPortalEnabled) {
    throw new Error("OVERSIGHT_BOARD_DISABLED");
  }
  return prisma.oversightBoardMeeting.create({
    data: { ...params, status: "scheduled" },
  });
}

export async function publishOversightDecision(params: {
  meetingId?: string;
  title: string;
  summary: string;
}) {
  return prisma.oversightBoardDecision.create({
    data: {
      ...params,
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function getOversightPortalSummary() {
  if (!phase10Config.oversightBoardPortalEnabled) {
    return { disabled: true, meetings: [], decisions: [] };
  }
  const [meetings, decisions] = await Promise.all([
    prisma.oversightBoardMeeting.findMany({
      orderBy: { meetingAt: "desc" },
      take: 10,
    }),
    prisma.oversightBoardDecision.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
  ]);
  return { disabled: false, meetings, decisions };
}

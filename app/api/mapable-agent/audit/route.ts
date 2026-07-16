import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const participantId = url.searchParams.get("participantId") ?? undefined;

  const events = await prisma.auditEvent.findMany({
    where: {
      action: { startsWith: "mapable_agent" },
      ...(participantId ? { participantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const toolLogs = await prisma.toolExecutionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ events, toolLogs });
}

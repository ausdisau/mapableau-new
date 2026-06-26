import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { createAgentSession } from "@/lib/mapable-agent/orchestrator";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const sessions = await prisma.agentSession.findMany({
    where: { actorUserId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      modelProvider: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await req.json()) as { title?: string; participantId?: string };
  const session = await createAgentSession({
    actorUserId: user.id,
    participantId: body.participantId ?? user.id,
    title: body.title,
  });

  return NextResponse.json({ session }, { status: 201 });
}

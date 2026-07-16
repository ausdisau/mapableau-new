import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  const session = await prisma.agentSession.findFirst({
    where: { id, actorUserId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      reviewTasks: { where: { status: "pending" } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  const body = (await req.json()) as { title?: string; status?: string };

  const existing = await prisma.agentSession.findFirst({
    where: { id, actorUserId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await prisma.agentSession.update({
    where: { id },
    data: {
      title: body.title,
      status: body.status as "active" | "archived" | "closed" | undefined,
    },
  });

  return NextResponse.json({ session });
}

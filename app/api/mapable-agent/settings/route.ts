import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const settings = await prisma.agentUserSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await req.json()) as {
    highContrastMode?: boolean;
    largeTouchTargets?: boolean;
    reducedMotion?: boolean;
    showReasoningSummary?: boolean;
  };

  const settings = await prisma.agentUserSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body },
    update: body,
  });

  return NextResponse.json({ settings });
}

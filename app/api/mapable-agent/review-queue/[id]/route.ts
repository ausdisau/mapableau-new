import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  const body = (await req.json()) as {
    status?: "in_progress" | "approved" | "rejected" | "cancelled";
    resolution?: string;
    assignedToId?: string;
  };

  const task = await prisma.humanReviewTask.update({
    where: { id },
    data: {
      status: body.status,
      resolution: body.resolution,
      assignedToId: body.assignedToId,
      resolvedById:
        body.status === "approved" || body.status === "rejected"
          ? user.id
          : undefined,
      resolvedAt:
        body.status === "approved" || body.status === "rejected"
          ? new Date()
          : undefined,
    },
  });

  return NextResponse.json({ task });
}

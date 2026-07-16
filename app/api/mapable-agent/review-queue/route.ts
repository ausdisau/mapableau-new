import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";

  const tasks = await prisma.humanReviewTask.findMany({
    where: { status: status as "pending" },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 100,
  });

  return NextResponse.json({ tasks });
}

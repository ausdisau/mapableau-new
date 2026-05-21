import { NextResponse } from "next/server";

import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      fundingSource: { select: { type: true, label: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, method: true, paidAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ invoices });
}

import type { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  const adminAccount = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role: "admin" } },
  });

  // Allow any authenticated user in dev until admin RBAC is wired
  const isDev = process.env.NODE_ENV !== "production";

  if (!adminAccount && !isDev) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as InvoiceStatus | null;
  const userFilter = searchParams.get("userId");
  const providerFilter = searchParams.get("providerId");
  const q = searchParams.get("q");

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(userFilter ? { userId: userFilter } : {}),
      ...(providerFilter ? { providerId: providerFilter } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q } },
              { bookingId: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      fundingSource: { select: { type: true, label: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const flags = {
    failedPayments: invoices.filter((i) => i.status === "failed").length,
    disputes: await prisma.payment.count({ where: { status: "disputed" } }),
    exportErrors: invoices.filter(
      (i) =>
        i.xeroExportStatus === "error" ||
        i.planManagerExportStatus === "error"
    ).length,
  };

  return NextResponse.json({ invoices, flags });
}

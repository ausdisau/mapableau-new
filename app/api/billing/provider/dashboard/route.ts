import { NextResponse } from "next/server";

import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  const billingAccount = await prisma.billingAccount.findFirst({
    where: { userId, role: { in: ["provider", "employer"] } },
    orderBy: { updatedAt: "desc" },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { providerId: { in: await getProviderIdsForUser(userId) } },
        { userId },
      ],
      status: { in: ["succeeded", "processing", "requires_payment"] },
    },
    include: {
      invoice: { select: { serviceType: true, totalCents: true } },
      splits: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    billingAccount,
    subscriptions,
    payments,
  });
}

async function getProviderIdsForUser(userId: string): Promise<string[]> {
  const roles = await prisma.providerUserRole.findMany({
    where: { userId },
    select: { providerId: true },
  });
  return roles.map((r) => r.providerId);
}

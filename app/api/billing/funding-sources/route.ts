import { NextResponse } from "next/server";

import { createAuditLog } from "@/lib/billing/audit";
import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { prisma } from "@/lib/prisma";
import { createFundingSourceSchema } from "@/schemas/billing.types";

export async function GET() {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  const sources = await prisma.fundingSource.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ fundingSources: sources });
}

export async function POST(request: Request) {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createFundingSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.isDefault) {
    await prisma.fundingSource.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const hasDefault = await prisma.fundingSource.count({
    where: { userId, isDefault: true },
  });

  const source = await prisma.fundingSource.create({
    data: {
      userId,
      type: data.type,
      label: data.label,
      ndisParticipantNumber: data.ndisParticipantNumber,
      planManagerName: data.planManagerName,
      planManagerEmail: data.planManagerEmail,
      isDefault: data.isDefault ?? hasDefault === 0,
      metadata: (data.metadata ?? {}) as object,
    },
  });

  await createAuditLog({
    actorUserId: userId,
    entityType: "FundingSource",
    entityId: source.id,
    action: "created",
    after: { type: source.type, label: source.label },
  });

  return NextResponse.json({ fundingSource: source }, { status: 201 });
}

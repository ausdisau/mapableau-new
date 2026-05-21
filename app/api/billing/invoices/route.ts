import { NextResponse } from "next/server";

import { createAuditLog } from "@/lib/billing/audit";
import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { calculateInvoiceTotals, calculateLineItemTotalCents } from "@/lib/billing/calculations";
import { isPlanManagedFunding } from "@/lib/billing/funding";
import { prisma } from "@/lib/prisma";
import { createInvoiceSchema } from "@/schemas/billing.types";

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

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  let fundingSource = null;
  if (data.fundingSourceId) {
    fundingSource = await prisma.fundingSource.findFirst({
      where: { id: data.fundingSourceId, userId },
    });
    if (!fundingSource) {
      return NextResponse.json(
        { error: "Funding source not found" },
        { status: 404 }
      );
    }
  }

  const totals = calculateInvoiceTotals(data.lineItems, {
    platformFeeCents: data.platformFeeCents,
  });

  const initialStatus = isPlanManagedFunding(fundingSource?.type)
    ? "issued"
    : "draft";

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      providerId: data.providerId,
      bookingId: data.bookingId,
      serviceType: data.serviceType,
      status: initialStatus,
      fundingSourceId: data.fundingSourceId,
      subtotalCents: totals.subtotalCents,
      platformFeeCents: totals.platformFeeCents,
      gstCents: totals.gstCents,
      totalCents: totals.totalCents,
      ndisLineItem: data.ndisLineItem,
      ndisClaimable: data.ndisClaimable ?? false,
      dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      lineItems: {
        create: data.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitAmountCents: li.unitAmountCents,
          totalCents: calculateLineItemTotalCents(
            li.quantity,
            li.unitAmountCents
          ),
          ndisLineItem: li.ndisLineItem,
          gstApplicable: li.gstApplicable ?? false,
          metadata: (li.metadata ?? {}) as object,
        })),
      },
    },
    include: { lineItems: true, fundingSource: true },
  });

  await createAuditLog({
    actorUserId: userId,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "created",
    after: {
      status: invoice.status,
      totalCents: invoice.totalCents,
      serviceType: invoice.serviceType,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}

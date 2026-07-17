import type { NdisClaimLine } from "@prisma/client";

import type { NdisInvoiceDraft } from "@/lib/ndis/claiming/types";
import { prisma } from "@/lib/prisma";

/**
 * Build a self-managed invoice draft for a specific participant's lines only.
 * Does NOT load or re-use the whole batch inside a participant loop.
 */
export async function buildSelfManagedInvoiceDraft(input: {
  batchId: string;
  participantId: string;
  lines: NdisClaimLine[];
}): Promise<NdisInvoiceDraft | null> {
  if (input.lines.length === 0) return null;

  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: input.batchId },
  });
  if (!batch || batch.paymentRoute !== "self_managed") {
    return null;
  }

  // Only the provided lines — never the whole batch.
  const participantLines = input.lines.filter(
    (l) =>
      l.participantId === input.participantId &&
      l.paymentRoute === "self_managed"
  );
  if (participantLines.length === 0) return null;

  const participant = await prisma.user.findUnique({
    where: { id: input.participantId },
  });

  const lines = participantLines.map((l) => ({
    supportItemCode: l.supportItemCode,
    description: l.supportDescription,
    serviceDate: l.serviceStartDate.toISOString().slice(0, 10),
    quantity: Number(l.quantity),
    unitPriceCents: l.unitPriceCents,
    totalCents: l.totalAmountCents,
  }));

  const totalCents = lines.reduce((s, l) => s + l.totalCents, 0);

  return {
    invoiceNumber: `SM-${batch.batchReference ?? batch.id.slice(0, 8)}-${input.participantId.slice(0, 6)}`,
    recipientType: "participant",
    recipientName: participant?.name ?? participantLines[0]!.participantName,
    lines,
    totalCents,
  };
}

/** @deprecated Prefer buildSelfManagedInvoiceDraft({ batchId, participantId, lines }). */
export async function buildSelfManagedInvoiceDraftForBatch(
  batchId: string
): Promise<NdisInvoiceDraft | null> {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: {
      lines: { where: { paymentRoute: "self_managed" } },
    },
  });
  if (!batch || batch.lines.length === 0) return null;
  const participantId = batch.lines[0]!.participantId;
  const lines = batch.lines.filter((l) => l.participantId === participantId);
  return buildSelfManagedInvoiceDraft({
    batchId,
    participantId,
    lines,
  });
}

export async function persistSelfManagedInvoices(
  batchId: string,
  createdById: string
) {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: { lines: true },
  });
  if (!batch) return [];

  const byParticipant = new Map<string, typeof batch.lines>();
  for (const line of batch.lines) {
    if (line.paymentRoute !== "self_managed") continue;
    const list = byParticipant.get(line.participantId) ?? [];
    list.push(line);
    byParticipant.set(line.participantId, list);
  }

  const invoices = [];
  for (const [participantId, lines] of byParticipant) {
    // Build draft from these specific participant lines only (not whole batch).
    const draft = await buildSelfManagedInvoiceDraft({
      batchId,
      participantId,
      lines,
    });
    const totalCents =
      draft?.totalCents ??
      lines.reduce((s, l) => s + l.totalAmountCents, 0);
    const inv = await prisma.ndisInvoice.create({
      data: {
        providerOrgId: batch.providerOrgId,
        participantId,
        paymentRoute: "self_managed",
        invoiceNumber:
          draft?.invoiceNumber ??
          `SM-${batch.batchReference}-${participantId.slice(0, 6)}`,
        status: "issued",
        totalCents,
        issuedAt: new Date(),
        createdById,
        lines: {
          create: lines.map((l, i) => ({
            supportItemCode: l.supportItemCode,
            description: l.supportDescription,
            serviceDate: l.serviceStartDate,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            totalCents: l.totalAmountCents,
            claimLineId: l.id,
            sortOrder: i,
          })),
        },
      },
      include: { lines: true },
    });
    await prisma.ndisClaimLine.updateMany({
      where: { id: { in: lines.map((l) => l.id) } },
      data: { ndisInvoiceId: inv.id, status: "exported" },
    });
    invoices.push(inv);
  }

  return invoices;
}

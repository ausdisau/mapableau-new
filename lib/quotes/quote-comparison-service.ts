import { prisma } from "@/lib/prisma";

export async function buildQuoteComparison(quoteRequestId: string) {
  const responses = await prisma.quoteResponse.findMany({
    where: { quoteRequestId },
    include: { lineItems: true },
  });

  const snapshot = {
    responses: responses.map((r) => ({
      id: r.id,
      organisationId: r.organisationId,
      totalCents: r.totalCents,
      lineItems: r.lineItems,
    })),
    disclaimer: "Quotes do not guarantee NDIS funding approval.",
  };

  await prisma.quoteComparisonSnapshot.create({
    data: {
      quoteRequestId,
      snapshotJson: snapshot,
    },
  });

  return snapshot;
}

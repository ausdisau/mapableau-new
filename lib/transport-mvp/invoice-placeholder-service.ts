import { prisma } from "@/lib/prisma";

const DISCLAIMER =
  "Pricing placeholder only. Not NDIS payment approval. Final pricing will use NDIS Pricing Intelligence when connected.";

export async function getInvoicePlaceholder(tripId: string) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: { evidence: true, request: true },
  });
  if (!trip) throw new Error("NOT_FOUND");

  const placeholder = {
    disclaimer: DISCLAIMER,
    lineItems: [
      {
        description: "Transport trip (placeholder)",
        quantity: 1,
        unit: "trip",
        amountAud: null,
        supportItemCode: null,
        note: "Amount TBD — NDIS Pricing Intelligence not wired",
      },
    ],
    evidence: trip.evidence
      ? {
          distanceKm: trip.evidence.distanceKm,
          startedAt: trip.evidence.startedAt,
          completedAt: trip.evidence.completedAt,
        }
      : null,
    generatedAt: new Date().toISOString(),
  };

  await prisma.transportTrip.update({
    where: { id: tripId },
    data: { invoicePlaceholderJson: placeholder },
  });

  return placeholder;
}

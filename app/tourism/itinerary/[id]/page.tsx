import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const itinerary = await prisma.tourismItinerary.findFirst({
    where: { id, participantId: user.id },
  });
  if (!itinerary) notFound();

  return (
    <main className="p-4">
      <h1 className="font-heading text-2xl font-bold">{itinerary.title}</h1>
      <p className="text-sm text-muted-foreground">Status: {itinerary.status}</p>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const bundle = await prisma.bookingBundle.findFirst({
    where: { id, participantId: user.id },
    include: { segments: { orderBy: { sequenceOrder: "asc" } } },
  });
  if (!bundle) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">
        {bundle.title ?? "Your journey"}
      </h1>
      <p className="text-sm text-muted-foreground">
        Status: {bundle.status.replace(/_/g, " ")}. Human confirmation is required
        before final dispatch.
      </p>
      <ol className="space-y-4" aria-label="Journey timeline">
        {bundle.segments.map((seg) => (
          <li key={seg.id} className="rounded-lg border p-4">
            <p className="font-medium">{seg.segmentType.replace(/_/g, " ")}</p>
            {seg.scheduledStart ? (
              <p className="text-sm text-muted-foreground">
                {new Date(seg.scheduledStart).toLocaleString("en-AU")}
                {seg.scheduledEnd
                  ? ` – ${new Date(seg.scheduledEnd).toLocaleString("en-AU")}`
                  : ""}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Buffer: {seg.bufferMinutes} minutes
            </p>
          </li>
        ))}
      </ol>
      <Link href="/dashboard/bookings" className="text-primary underline">
        Back to bookings
      </Link>
    </main>
  );
}

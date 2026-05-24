import { notFound } from "next/navigation";

import { ShiftDetailCard } from "@/components/workforce/ShiftDetailCard";
import { StartFinishServiceButtons } from "@/components/workforce/StartFinishServiceButtons";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function WorkerShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("care:shift:work");
  const { id } = await params;
  const shift = await prisma.careShift.findFirst({
    where: { id, workerProfile: { userId: user.id } },
  });
  if (!shift) notFound();

  return (
    <main className="mx-auto max-w-lg space-y-6 p-4">
      <ShiftDetailCard
        title="Care shift"
        startAt={shift.startAt.toISOString()}
        location={shift.location ?? "Location confirmed with provider"}
        notes="Participant access notes are shown only for confirmed bookings."
      />
      <StartFinishServiceButtons shiftId={shift.id} />
    </main>
  );
}

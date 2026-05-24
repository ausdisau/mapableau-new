import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Therapy appointments | Provider" };

export default async function ProviderMovesPage() {
  const user = await requireAuth();
  const therapist = await prisma.therapistProfile.findFirst({
    where: { userId: user.id },
  });

  if (!therapist) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="font-heading text-2xl font-bold">MapAble Moves</h1>
        <p role="status">
          No verified therapist profile is linked to your account.
        </p>
      </div>
    );
  }

  const appointments = await prisma.therapyAppointment.findMany({
    where: { therapistProfileId: therapist.id },
    include: { participant: { select: { name: true, email: true } } },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Your therapy schedule</h1>
      <ul className="space-y-3">
        {appointments.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex justify-between gap-2">
              <span className="font-medium">
                {a.participant.name ?? a.participant.email}
              </span>
              <StatusTextBadge status={a.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {a.startsAt.toLocaleString()} · {a.deliveryMode.replace(/_/g, " ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

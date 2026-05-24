import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { HomeVisitRiskChecklist } from "@/components/moves/HomeVisitRiskChecklist";
import { TelehealthJoinPanel } from "@/components/moves/TelehealthJoinPanel";
import { requireAuth } from "@/lib/auth/guards";
import { getTherapyAppointment } from "@/lib/moves/therapy-booking-service";

type Props = { params: Promise<{ appointmentId: string }> };

export default async function TherapyAppointmentPage({ params }: Props) {
  const user = await requireAuth();
  const { appointmentId } = await params;
  const appointment = await getTherapyAppointment(appointmentId, user.id);
  if (!appointment) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/moves" className="text-sm text-primary hover:underline">
        ← Moves
      </Link>
      <header className="flex flex-wrap justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {appointment.therapistProfile.displayName}
          </h1>
          <p className="text-muted-foreground">
            {appointment.therapyType.replace(/_/g, " ")} ·{" "}
            {appointment.startsAt.toLocaleString()}
          </p>
        </div>
        <StatusTextBadge status={appointment.status} />
      </header>
      {appointment.telehealthSession ? (
        <TelehealthJoinPanel
          secureLinkToken={appointment.telehealthSession.secureLinkToken}
          linkExpiresAt={appointment.telehealthSession.linkExpiresAt}
        />
      ) : null}
      {appointment.deliveryMode === "home_visit" ? (
        <HomeVisitRiskChecklist appointmentId={appointment.id} />
      ) : null}
      {appointment.progressSummaries[0] ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium">Your progress summary</h2>
          <p className="mt-2 text-sm">
            {appointment.progressSummaries[0].plainLanguageSummary}
          </p>
        </section>
      ) : null}
    </div>
  );
}

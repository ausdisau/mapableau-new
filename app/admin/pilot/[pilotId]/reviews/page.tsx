import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotReviewsPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);

  const reviews = await prisma.pilotDailyReview.findMany({
    where: { pilotId },
    orderBy: { reviewDate: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Daily reviews — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/reviews" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      {reviews.length === 0 ? (
        <p>No daily reviews recorded yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {reviews.map((r) => (
            <li key={r.id} className="rounded border p-3">
              {r.reviewDate.toISOString().slice(0, 10)} — Outcome:{" "}
              {r.outcome.replace(/_/g, " ")}
              {r.notes ? ` · ${r.notes}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

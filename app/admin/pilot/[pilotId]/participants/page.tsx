import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotParticipantsPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);

  const enrolments = await prisma.pilotParticipantEnrolment.findMany({
    where: { pilotId },
    orderBy: { updatedAt: "desc" },
    include: {
      participant: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Participants — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/participants" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <p className="text-sm">
        Enrolment requires explicit pilot consent. No AI enrolment or approval.
        NDIS numbers are never shown here.
      </p>
      {enrolments.length === 0 ? (
        <p>No participants invited yet.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Pilot consent</th>
            </tr>
          </thead>
          <tbody>
            {enrolments.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="py-2 pr-2">
                  {e.participant.name ?? e.participant.email ?? e.participantId}
                </td>
                <td className="py-2 pr-2">{e.status.replace(/_/g, " ")}</td>
                <td className="py-2 pr-2">
                  {e.pilotConsentAt
                    ? `Recorded ${e.pilotConsentAt.toISOString()}`
                    : "Not recorded"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

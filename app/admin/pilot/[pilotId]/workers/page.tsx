import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotWorkersPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);

  const workers = await prisma.pilotWorkerAuthorisation.findMany({
    where: { pilotId },
    orderBy: { updatedAt: "desc" },
    include: {
      workerUser: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Workers — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/workers" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <p className="text-sm">
        Runtime eligibility only. Credential details and restricted findings are
        not displayed.
      </p>
      {workers.length === 0 ? (
        <p>No workers authorised for this pilot.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-2">Worker</th>
              <th className="py-2 pr-2">Authorisation</th>
              <th className="py-2 pr-2">Revoke reason</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b">
                <td className="py-2 pr-2">
                  {w.workerUser.name ?? w.workerUser.email ?? w.workerUserId}
                </td>
                <td className="py-2 pr-2">
                  {w.active ? "Active" : "Suspended / inactive"}
                </td>
                <td className="py-2 pr-2">{w.revokeReason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { listPilotComplaints } from "@/lib/pilot/complaints/pilot-complaint-service";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotComplaintsPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);
  const complaints = await listPilotComplaints(pilotId);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Complaints — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/complaints" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <p className="text-sm">
        Linked Complaint records only. Non-retaliation policy applies. Anonymous
        complaints are supported.
      </p>
      {complaints.length === 0 ? (
        <p>No complaints linked to this pilot.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {complaints.map((c) => (
            <li key={c.id} className="rounded border p-3">
              <span className="font-medium">{c.title}</span>
              <span>
                {" "}
                — Status: {c.status}
                {c.anonymous ? " · Anonymous: yes" : " · Anonymous: no"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

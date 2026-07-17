import { PilotEnvironmentBanner } from "@/app/admin/pilot/_components/PilotEnvironmentBanner";
import { PilotSubnav } from "@/app/admin/pilot/_components/PilotSubnav";
import { loadAdminPilotPage } from "@/app/admin/pilot/_lib/load-pilot";
import { listPilotIncidents } from "@/lib/pilot/incidents/pilot-incident-service";

type Props = { params: Promise<{ pilotId: string }> };

export default async function AdminPilotIncidentsPage({ params }: Props) {
  const { pilotId } = await params;
  const { pilot } = await loadAdminPilotPage(pilotId);
  const incidents = await listPilotIncidents(pilotId);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Incidents — {pilot.name}
      </h1>
      <PilotSubnav pilotId={pilotId} current="/incidents" />
      <PilotEnvironmentBanner
        stage={pilot.stage}
        limitedLiveEnabled={pilot.limitedLiveEnabled}
        status={pilot.status}
      />
      <p className="text-sm">
        Incidents are linked from the existing IncidentReport system — this page
        does not create a second incident store.
      </p>
      {incidents.length === 0 ? (
        <p>No incidents linked to this pilot.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {incidents.map((i) => (
            <li key={i.id} className="rounded border p-3">
              <span className="font-medium">{i.title}</span>
              <span>
                {" "}
                — Status: {i.status} · Reportability:{" "}
                {(i.reportabilityState ?? "not_assessed").replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

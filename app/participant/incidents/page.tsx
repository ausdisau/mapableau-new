import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { listParticipantIncidents } from "@/lib/quality/quality-service";

export const metadata = { title: "Incidents | Participant admin" };

export default async function ParticipantIncidentsPage() {
  const user = await requireParticipantPanel();
  const incidents = await listParticipantIncidents(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Incidents</h1>
      <PanelSection title="Your incident reports">
        <ul className="space-y-2 text-sm">
          {incidents.map((i) => (
            <li key={i.id} className="rounded-lg border border-border px-3 py-2">
              {i.title} · {i.status}
            </li>
          ))}
        </ul>
      </PanelSection>
      <Link href="/dashboard/incidents/new" className="text-sm text-primary hover:underline">
        Report incident →
      </Link>
    </div>
  );
}

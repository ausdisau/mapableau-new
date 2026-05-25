import Link from "next/link";

import { SafetyAndComplaintsPanel } from "@/components/admin-panels/participant/SafetyAndComplaintsPanel";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import {
  listParticipantComplaints,
  listParticipantIncidents,
} from "@/lib/quality/quality-service";

export const metadata = { title: "Complaints | Participant admin" };

export default async function ParticipantComplaintsPage() {
  const user = await requireParticipantPanel();
  const [complaints, incidents] = await Promise.all([
    listParticipantComplaints(user),
    listParticipantIncidents(user),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Complaints & safety</h1>
      <SafetyAndComplaintsPanel complaints={complaints} incidents={incidents} />
      <Link href="/dashboard/incidents/new" className="text-sm text-primary hover:underline">
        Report a new concern →
      </Link>
    </div>
  );
}

import { ParticipantTimeline } from "@/components/admin-panels/participant/ParticipantTimeline";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { getParticipantTimeline } from "@/lib/participants/participant-service";

export const metadata = { title: "Timeline | Participant admin" };

export default async function ParticipantTimelinePage() {
  const user = await requireParticipantPanel();
  const data = await getParticipantTimeline(user);

  const entries = [
    ...data.bookings.map((e) => ({
      id: e.id,
      kind: "Booking",
      title: e.title,
      at: e.createdAt,
    })),
    ...data.incidents.map((i) => ({
      id: i.id,
      kind: "Incident",
      title: i.title,
      at: i.createdAt,
      status: i.status,
    })),
    ...data.complaints.map((c) => ({
      id: c.id,
      kind: "Complaint",
      title: c.category,
      at: c.createdAt,
      status: c.status,
    })),
    ...data.consents.map((c) => ({
      id: c.id,
      kind: "Consent",
      title: String(c.scope),
      at: c.updatedAt,
      status: c.status,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Timeline</h1>
      <ParticipantTimeline entries={entries} />
    </div>
  );
}

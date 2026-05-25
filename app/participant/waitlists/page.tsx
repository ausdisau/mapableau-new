import { PanelSection } from "@/components/admin-panels/PanelSection";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { listParticipantWaitlists } from "@/lib/capacity/capacity-service";

export const metadata = { title: "Waitlists | Participant admin" };

export default async function ParticipantWaitlistsPage() {
  const user = await requireParticipantPanel();
  const waitlists = await listParticipantWaitlists(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Waitlists</h1>
      <PanelSection title="Your waitlist requests">
        <ul className="space-y-2 text-sm">
          {waitlists.map((w) => (
            <li key={w.id} className="rounded-lg border border-border px-3 py-2">
              {w.serviceType} · {w.status}
              {w.organisation ? ` · ${w.organisation.name}` : ""}
            </li>
          ))}
        </ul>
      </PanelSection>
    </div>
  );
}

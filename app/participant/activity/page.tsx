import { requireParticipantSelf } from "@/lib/auth/guards";
import { getParticipantActivityTimeline } from "@/lib/audit/domain-event-service";

export const metadata = { title: "My activity | MapAble" };

export default async function ParticipantActivityPage() {
  const user = await requireParticipantSelf();
  const events = await getParticipantActivityTimeline(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">My activity</h1>
        <p className="mt-1 text-muted-foreground">
          Timeline of important events related to your care and support on MapAble.
        </p>
      </header>
      <ol className="space-y-4">
        {events.length === 0 ? (
          <li className="text-muted-foreground">No activity events recorded yet.</li>
        ) : (
          events.map((event) => (
            <li key={event.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{event.summary}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.domain} · {new Date(event.createdAt).toLocaleString("en-AU")}
              </p>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}

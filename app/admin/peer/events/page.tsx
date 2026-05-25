import { listPeerEvents } from "@/lib/peer/peer-event-service";

export default async function AdminPeerEventsPage() {
  const events = await listPeerEvents();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer events</h1>
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            {e.title} — {e.startsAt.toLocaleString("en-AU")}
          </li>
        ))}
      </ul>
    </div>
  );
}

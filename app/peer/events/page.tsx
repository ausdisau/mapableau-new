import { PeerEventList } from "@/components/peer";
import { listPeerEvents } from "@/lib/peer/peer-event-service";

export default async function PeerEventsPage() {
  const events = await listPeerEvents();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer events</h1>
      <PeerEventList events={events} />
    </div>
  );
}

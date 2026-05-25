import Link from "next/link";

import { PeerCircleList } from "@/components/peer";
import { listPeerCircles } from "@/lib/peer/peer-circle-service";

export default async function PeerCirclesPage() {
  const circles = await listPeerCircles();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer circles</h1>
      <PeerCircleList
        circles={circles.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          topic: c.topic,
          memberCount: c._count.members,
        }))}
      />
      <Link href="/peer" className="text-sm underline">
        Back to Peer home
      </Link>
    </div>
  );
}

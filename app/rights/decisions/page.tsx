import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import {
  isDecisionRoomEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import { prisma } from "@/lib/prisma";

export default async function DecisionsPage() {
  const user = await requireAuth();

  if (!isRightsOsEnabled() || !isDecisionRoomEnabled()) {
    return <p>Decision Room is not enabled.</p>;
  }

  const rooms = await prisma.decisionRoom.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: { options: true, records: true, dissents: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Supported Decision Room</h2>
      <p className="text-sm text-muted-foreground">
        You make the decision. Supporters may contribute and disagree, but cannot
        replace your choice.
      </p>
      <ul className="divide-y rounded-lg border">
        {rooms.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">No decisions yet.</li>
        ) : (
          rooms.map((room) => (
            <li key={room.id} className="p-4">
              <Link href={`/rights/decisions/${room.id}`} className="font-medium underline">
                {room.title}
              </Link>
              <p className="text-sm text-muted-foreground">{room.question}</p>
              <p className="text-xs text-muted-foreground">
                Status: {room.status}
                {room.dissents.length > 0 ? " · Supporter dissent recorded" : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

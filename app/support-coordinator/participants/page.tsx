import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CoordinatorParticipantsPage() {
  const user = await requirePermission("coordinator:portal");

  const caseload = await prisma.supportCoordinatorRelationship.findMany({
    where: { coordinatorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Your caseload</h1>
      <p className="text-muted-foreground">
        You only see participants who have granted consent.
      </p>
      <ul className="space-y-3">
        {caseload.length === 0 ? (
          <li className="text-sm text-muted-foreground">No linked participants yet.</li>
        ) : (
          caseload.map((c) => (
            <li key={c.id} className="rounded border p-3">
              <Link
                href={`/support-coordinator/participants/${c.participantId}`}
                className="font-medium text-primary underline"
              >
                Participant
              </Link>
              <span className="ml-2 text-sm text-muted-foreground">({c.status})</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

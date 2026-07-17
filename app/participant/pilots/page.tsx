import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ParticipantPilotsPage() {
  const user = await requirePermission("participant:pilot:view");

  const enrolments = await prisma.pilotParticipantEnrolment.findMany({
    where: { participantId: user.id },
    include: { pilot: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Your pilot programs</h1>
        <p className="text-sm">
          These are controlled pilot programs. Taking part is voluntary and needs
          separate pilot consent. Ordinary platform consent is not enough.
        </p>
      </header>
      {enrolments.length === 0 ? (
        <p>You have not been invited to a controlled pilot.</p>
      ) : (
        <ul className="space-y-3">
          {enrolments.map((e) => {
            const envLabel =
              e.pilot.stage === "limited_live" ||
              e.pilot.stage === "controlled_live"
                ? "Limited live"
                : "Sandbox / non-live";
            return (
              <li key={e.id} className="rounded border p-4">
                <Link
                  href={`/participant/pilots/${e.pilotId}`}
                  className="font-medium underline"
                >
                  {e.pilot.name}
                </Link>
                <p className="mt-1 text-sm">
                  Enrolment status: {e.status.replace(/_/g, " ")} · Environment:{" "}
                  {envLabel} · Pilot status: {e.pilot.status.replace(/_/g, " ")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ParticipantIncidentsPage() {
  const user = await requireAuth();
  const incidents = await prisma.incidentReport.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Your reports</h1>
          <p className="text-muted-foreground">
            You can save a draft and return later. Only authorised people can see
            full details.
          </p>
        </div>
        <Link
          href="/dashboard/incidents/new"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground"
        >
          Report a concern
        </Link>
      </header>
      <ul className="space-y-3">
        {incidents.map((i) => (
          <li key={i.id} className="rounded-lg border p-4">
            <Link
              href={`/dashboard/incidents/${i.id}`}
              className="font-medium text-primary underline"
            >
              {i.title} — {i.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

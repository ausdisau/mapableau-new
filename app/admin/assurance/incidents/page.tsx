import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AssuranceIncidentsPage() {
  await requireAdmin();
  const [operational, exercises] = await Promise.all([
    prisma.operationalIncident.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
    prisma.incidentResponseExercise.findMany({
      orderBy: { conductedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Incidents and exercises</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Incident records require human review for regulatory notification. No AI may
        approve go-live.
      </p>

      <section aria-labelledby="operational-incidents-heading">
        <h2 id="operational-incidents-heading" className="font-heading text-lg font-semibold">
          Operational incidents
        </h2>
        {operational.length === 0 ? (
          <p className="text-sm">No operational incidents recorded.</p>
        ) : (
          <ul className="space-y-3">
            {operational.map((incident) => (
              <li key={incident.id} className="border-b py-2">
                <div className="font-medium">{incident.title}</div>
                <div className="text-sm">
                  {incident.severity} · {incident.status} · started{" "}
                  {incident.startedAt.toISOString().slice(0, 10)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="exercises-heading">
        <h2 id="exercises-heading" className="font-heading text-lg font-semibold">
          Response exercises
        </h2>
        {exercises.length === 0 ? (
          <p className="text-sm">No incident response exercises recorded.</p>
        ) : (
          <ul className="space-y-3">
            {exercises.map((exercise) => (
              <li key={exercise.id} className="border-b py-2">
                <div className="font-medium">{exercise.title}</div>
                <div className="text-sm">
                  {exercise.conductedAt
                    ? exercise.conductedAt.toISOString().slice(0, 10)
                    : "not conducted"}{" "}
                  · {exercise.outcome ?? "no outcome recorded"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

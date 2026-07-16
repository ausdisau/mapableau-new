"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DependencyList } from "@/components/continuity-os/DependencyList";

export default function LifeEventDependenciesPage() {
  const params = useParams<{ missionId: string }>();
  const [deps, setDeps] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/life-events/${params.missionId}/dependencies`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.message ?? data.error);
        else setDeps(data);
      })
      .catch(() => setError("Could not load dependencies."));
  }, [params.missionId]);

  const projection = deps?.projection as
    | {
        unknowns?: string[];
        blockers?: string[];
        singlePointsOfFailure?: string[];
        responsibilities?: Array<Record<string, string>>;
      }
    | undefined;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href={`/life-events/${params.missionId}`} className="underline">
          Back to mission
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Dependencies and responsibility</h1>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {deps?.listAlternative ? (
        <DependencyList
          items={
            deps.listAlternative as Array<{
              label: string;
              state: string;
              owner: string;
              required: boolean;
              alternative?: string;
            }>
          }
          unknowns={projection?.unknowns}
          blockers={projection?.blockers}
          singlePointsOfFailure={projection?.singlePointsOfFailure}
        />
      ) : null}
      {projection?.responsibilities ? (
        <section aria-labelledby="responsibility-map-heading">
          <h2 id="responsibility-map-heading" className="text-lg font-semibold">
            Responsibility map
          </h2>
          <ul className="mt-3 space-y-2">
            {projection.responsibilities.map((row) => (
              <li
                key={row.dependencyCode}
                className="rounded border border-slate-200 bg-white p-3 text-sm"
              >
                <p className="font-medium">{row.dependencyCode}</p>
                <p>Provider: {row.serviceProvider}</p>
                <p>MapAble role: {row.mapableRole}</p>
                <p>Decision authority: {row.decisionAuthority}</p>
                <p>Complaint route: {row.complaintRoute}</p>
                <p>Recovery responsibility: {row.recoveryResponsibility}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

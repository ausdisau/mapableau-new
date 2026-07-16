"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DependencyList } from "@/components/continuity-os/DependencyList";
import type { LifeEventDependencyNode } from "@/lib/continuity-os/types";

export default function DependenciesPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const [missionId, setMissionId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<LifeEventDependencyNode[]>([]);
  const [spoFs, setSpoFs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMissionId(p.missionId));
  }, [params]);

  useEffect(() => {
    if (!missionId) return;
    void fetch(`/api/life-events/${missionId}/dependencies`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load dependencies");
        return body as {
          projection: {
            nodes: LifeEventDependencyNode[];
            singlePointsOfFailure: string[];
          };
        };
      })
      .then((data) => {
        setNodes(data.projection.nodes);
        setSpoFs(data.projection.singlePointsOfFailure);
      })
      .catch((e: Error) => setError(e.message));
  }, [missionId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link
          href={missionId ? `/life-events/${missionId}` : "/life-events"}
          className="text-sky-800 underline"
        >
          Back to mission
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Dependencies</h1>
      {error ? (
        <p className="mt-4 text-rose-700" role="alert">
          {error}
        </p>
      ) : (
        <div className="mt-6">
          <DependencyList nodes={nodes} singlePointsOfFailure={spoFs} />
        </div>
      )}
    </main>
  );
}

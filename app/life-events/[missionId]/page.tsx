"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DependencyList } from "@/components/continuity-os/DependencyList";
import { ParticipantGoalCard } from "@/components/continuity-os/ParticipantGoalCard";
import { StopContinuityControl } from "@/components/continuity-os/StopContinuityControl";

export default function LifeEventDetailPage() {
  const params = useParams<{ missionId: string }>();
  const missionId = params.missionId;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [deps, setDeps] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) return;
    Promise.all([
      fetch(`/api/life-events/${missionId}`).then((r) => r.json()),
      fetch(`/api/life-events/${missionId}/dependencies`).then((r) => r.json()),
    ])
      .then(([missionData, depData]) => {
        if (missionData.error) {
          setError(missionData.message ?? missionData.error);
          return;
        }
        setData(missionData);
        if (!depData.error) setDeps(depData);
      })
      .catch(() => setError("Could not load life event."));
  }, [missionId]);

  const extension = data?.extension as
    | {
        participantGoal: string;
        participantWording: string;
        lifeEventTypeCode: string;
        currentState: string;
        unknownsJson: string[];
        blockersJson: string[];
      }
    | undefined;
  const definition = data?.definition as { title?: string } | undefined;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/life-events" className="underline">
          Life events
        </Link>
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">Life-event mission</h1>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {extension ? (
        <ParticipantGoalCard
          goal={extension.participantGoal}
          wording={extension.participantWording}
          lifeEventTitle={definition?.title}
        />
      ) : null}
      <p className="text-sm text-slate-700">
        Status: <strong>{extension?.currentState ?? "loading"}</strong>
      </p>
      <nav aria-label="Life event sections">
        <ul className="flex flex-wrap gap-3 text-sm">
          <li>
            <Link className="underline" href={`/life-events/${missionId}/timeline`}>
              Timeline
            </Link>
          </li>
          <li>
            <Link
              className="underline"
              href={`/life-events/${missionId}/dependencies`}
            >
              Dependencies
            </Link>
          </li>
          <li>
            <Link className="underline" href={`/life-events/${missionId}/resilience`}>
              Resilience
            </Link>
          </li>
          <li>
            <Link className="underline" href="/recovery">
              Recovery
            </Link>
          </li>
        </ul>
      </nav>
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
          unknowns={
            ((deps.projection as { unknowns?: string[] } | undefined)?.unknowns ??
              extension?.unknownsJson) as string[]
          }
          blockers={
            ((deps.projection as { blockers?: string[] } | undefined)?.blockers ??
              extension?.blockersJson) as string[]
          }
          singlePointsOfFailure={
            (deps.projection as { singlePointsOfFailure?: string[] } | undefined)
              ?.singlePointsOfFailure
          }
        />
      ) : null}
      <StopContinuityControl missionId={missionId} />
    </main>
  );
}

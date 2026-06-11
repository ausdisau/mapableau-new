"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  coordinateFetch,
  participantQuery,
} from "@/components/coordinate/coordinate-client";
import { HumanReviewQueue } from "@/components/coordinate/HumanReviewQueue";
import { RiskFlagCard } from "@/components/coordinate/RiskFlagCard";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";

export default function CoordinateReviewsPage() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const query = participantQuery(participantId);

  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      summary: string;
      taskType: string;
      status: string;
      priority: number;
      confidence?: number | null;
      reason?: string | null;
      participant?: {
        name?: string | null;
        participantProfile?: {
          displayName?: string | null;
          preferredName?: string | null;
        } | null;
      } | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await coordinateFetch<{ tasks: typeof tasks }>(
        `/api/coordinate/reviews${query}`,
      );
      setTasks(res.tasks);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const lowConfidenceTasks = tasks.filter((t) => t.taskType === "low_confidence");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader
        title="Review queue"
        description="Approve or reject AI suggestions before they affect the participant record."
      />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      <HumanReviewQueue
        tasks={tasks}
        onUpdateStatus={async (taskId, status) => {
          await coordinateFetch(`/api/coordinate/reviews/${taskId}${query}`, {
            method: "PATCH",
            body: JSON.stringify({ participantId, status }),
          });
          await load();
        }}
      />
      {lowConfidenceTasks.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-semibold">Risk highlights</h2>
          {lowConfidenceTasks.slice(0, 3).map((task) => (
            <RiskFlagCard
              key={task.id}
              flag={{
                id: task.id,
                code: task.taskType,
                severity: "medium",
                summary: task.summary,
                reason: task.reason,
                confidence: task.confidence,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

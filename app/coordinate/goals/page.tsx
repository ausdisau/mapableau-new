"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  coordinateFetch,
  participantQuery,
} from "@/components/coordinate/coordinate-client";
import { GoalActionMapper } from "@/components/coordinate/GoalActionMapper";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";
import { Button } from "@/components/ui/button";

export default function CoordinateGoalsPage() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const query = participantQuery(participantId);

  const [planId, setPlanId] = useState<string | null>(null);
  const [goals, setGoals] = useState<
    Array<{
      id: string;
      title: string;
      description?: string | null;
      status: string;
      confidence?: number | null;
    }>
  >([]);
  const [actions, setActions] = useState<
    Array<{ id: string; title: string; status: string; goalId?: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plansRes = await coordinateFetch<{ plans: Array<{ id: string; status: string }> }>(
        `/api/coordinate/plans${query}`,
      );
      const plan = plansRes.plans.find((p) => ["draft", "active"].includes(p.status));
      if (!plan) {
        setPlanId(null);
        return;
      }
      setPlanId(plan.id);

      const [goalsRes, actionsRes] = await Promise.all([
        coordinateFetch<{ goals: typeof goals }>(
          `/api/coordinate/plans/${plan.id}/goals${query}`,
        ),
        coordinateFetch<{ actions: typeof actions }>(
          `/api/coordinate/plans/${plan.id}/actions${query}`,
        ),
      ]);
      setGoals(goalsRes.goals);
      setActions(actionsRes.actions);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function extractGoals() {
    if (!planId) return;
    setExtracting(true);
    try {
      await coordinateFetch(`/api/coordinate/plans/${planId}/goals${query}`, {
        method: "POST",
        body: JSON.stringify({ participantId, action: "extract" }),
      });
      await load();
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader title="Goals & actions" />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {!planId && !loading ? (
        <p className="text-sm text-muted-foreground">
          Add a plan summary first, then extract goals here.
        </p>
      ) : null}
      {planId ? (
        <>
          <Button variant="default" size="default" className="min-h-11" onClick={() => void extractGoals()} disabled={extracting}>
            {extracting ? "Extracting…" : "Extract goals from plan"}
          </Button>
          <GoalActionMapper
            goals={goals}
            actions={actions}
            onConfirmGoal={async (goalId) => {
              await coordinateFetch(`/api/coordinate/plans/${planId}/goals${query}`, {
                method: "POST",
                body: JSON.stringify({ participantId, action: "confirm", goalId }),
              });
              await load();
            }}
            onMapAction={async (actionId, goalId) => {
              await coordinateFetch(`/api/coordinate/plans/${planId}/actions${query}`, {
                method: "PATCH",
                body: JSON.stringify({
                  participantId,
                  actionId,
                  goalId,
                  action: "map_goal",
                }),
              });
              await load();
            }}
            onApproveAction={async (actionId) => {
              await coordinateFetch(`/api/coordinate/plans/${planId}/actions${query}`, {
                method: "PATCH",
                body: JSON.stringify({
                  participantId,
                  actionId,
                  action: "approve",
                }),
              });
              await load();
            }}
          />
        </>
      ) : null}
    </div>
  );
}

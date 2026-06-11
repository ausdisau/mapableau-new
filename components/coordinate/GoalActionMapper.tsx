"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CoordinateConfirmDialog } from "./CoordinateShell";

type Goal = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  confidence?: number | null;
};

type Action = {
  id: string;
  title: string;
  status: string;
  goalId?: string | null;
};

export function GoalActionMapper({
  goals,
  actions,
  onConfirmGoal,
  onMapAction,
  onApproveAction,
}: {
  goals: Goal[];
  actions: Action[];
  onConfirmGoal: (goalId: string) => Promise<void>;
  onMapAction: (actionId: string, goalId: string) => Promise<void>;
  onApproveAction: (actionId: string) => Promise<void>;
}) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>NDIS goals</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3" role="listbox" aria-label="Plan goals">
            {goals.map((goal) => (
              <li key={goal.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left min-h-11 ${
                    selectedGoalId === goal.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedGoalId(goal.id)}
                  aria-selected={selectedGoalId === goal.id}
                >
                  <p className="font-medium">{goal.title}</p>
                  {goal.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline">{goal.status}</Badge>
                    {goal.status === "proposed" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-h-11"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onConfirmGoal(goal.id);
                        }}
                      >
                        Confirm goal
                      </Button>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {actions.map((action) => (
              <li key={action.id} className="rounded-lg border p-3">
                <p className="font-medium">{action.title}</p>
                <Badge className="mt-2" variant="outline">
                  {action.status}
                </Badge>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                    disabled={!selectedGoalId}
                    onClick={() => {
                      if (!selectedGoalId) return;
                      setPendingActionId(action.id);
                      setConfirmOpen(true);
                    }}
                  >
                    Link to selected goal
                  </Button>
                  {action.status !== "approved" ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="min-h-11"
                      onClick={() => void onApproveAction(action.id)}
                    >
                      Approve action
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <CoordinateConfirmDialog
        open={confirmOpen}
        title="Link action to goal?"
        description="This maps the support action to the selected goal. You can change it later."
        confirmLabel="Link action"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingActionId(null);
        }}
        onConfirm={() => {
          if (pendingActionId && selectedGoalId) {
            void onMapAction(pendingActionId, selectedGoalId);
          }
          setConfirmOpen(false);
          setPendingActionId(null);
        }}
      />
    </div>
  );
}

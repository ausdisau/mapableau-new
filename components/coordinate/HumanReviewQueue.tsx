"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReviewTask = {
  id: string;
  summary: string;
  taskType: string;
  status: string;
  priority: number;
  confidence?: number | null;
  reason?: string | null;
  participant?: {
    name?: string | null;
    participantProfile?: { displayName?: string | null; preferredName?: string | null } | null;
  } | null;
};

export function HumanReviewQueue({
  tasks,
  onUpdateStatus,
}: {
  tasks: ReviewTask[];
  onUpdateStatus: (
    taskId: string,
    status: "approved" | "rejected" | "in_progress",
    participantId?: string,
  ) => Promise<void>;
}) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open review tasks. AI suggestions that need a human check will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Human review queue">
      {tasks.map((task) => {
        const name =
          task.participant?.participantProfile?.preferredName ??
          task.participant?.participantProfile?.displayName ??
          task.participant?.name ??
          "Participant";

        return (
          <li key={task.id}>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{task.summary}</CardTitle>
                  <p className="text-xs text-muted-foreground">{name}</p>
                </div>
                <Badge variant="outline">{task.taskType.replace(/_/g, " ")}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.reason ? (
                  <p className="text-sm text-muted-foreground">{task.reason}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="min-h-11"
                    onClick={() => void onUpdateStatus(task.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => void onUpdateStatus(task.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-11"
                    onClick={() => void onUpdateStatus(task.id, "in_progress")}
                  >
                    In progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Task = {
  id: string;
  title: string;
  status: string;
  taskType: string;
  relationship: { participantId: string };
};

export function CoordinatorTaskList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
          <div>
            <p className="font-medium">{t.title}</p>
            <p className="text-sm text-muted-foreground">
              {t.taskType.replace(/_/g, " ")} — {t.status}
            </p>
            <Link
              href={`/support-coordinator/participants/${t.relationship.participantId}`}
              className="text-sm text-primary underline"
            >
              View participant
            </Link>
          </div>
          {t.status === "open" ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={loadingId === t.id}
              onClick={async () => {
                setLoadingId(t.id);
                await fetch(`/api/support-coordinator/tasks?taskId=${t.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "done" }),
                });
                setLoadingId(null);
                router.refresh();
              }}
            >
              Mark done
            </Button>
          ) : null}
        </li>
      ))}
      {tasks.length === 0 ? (
        <li className="text-sm text-muted-foreground">No open tasks.</li>
      ) : null}
    </ul>
  );
}

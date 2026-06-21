"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ReviewTask = {
  id: string;
  title: string;
  summary: string;
  category: string;
  priority: string;
  status: string;
};

export default function ReviewQueuePage() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);

  useEffect(() => {
    void fetch("/api/mapable-agent/review-queue")
      .then((r) => r.json())
      .then((data: { tasks?: ReviewTask[] }) => setTasks(data.tasks ?? []));
  }, []);

  async function approve(id: string) {
    await fetch(`/api/mapable-agent/review-queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved", resolution: "Approved by staff" }),
    });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Human review queue</h1>
      <p className="mt-2 text-slate-600">
        Low-confidence, privacy, payment, and safeguarding tasks wait here before any external
        action.
      </p>
      <ul className="mt-6 space-y-4" aria-label="Pending review tasks">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h2 className="font-semibold text-slate-900">{task.title}</h2>
            <p className="mt-1 text-slate-700">{task.summary}</p>
            <p className="mt-2 text-sm text-slate-500">
              {task.category} · {task.priority}
            </p>
            <Button
              type="button"
              variant="default"
              size="default"
              className="mt-3 min-h-11 touch-manipulation"
              onClick={() => void approve(task.id)}
            >
              Approve for staff follow-up
            </Button>
          </li>
        ))}
        {tasks.length === 0 ? (
          <li role="status" className="text-slate-600">
            No pending reviews.
          </li>
        ) : null}
      </ul>
    </>
  );
}

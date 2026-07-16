"use client";

import { useEffect, useState } from "react";

import { ReviewQueueTable } from "@/components/mapable-agent/ReviewQueueTable";

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
      <ReviewQueueTable tasks={tasks} onApprove={(id) => void approve(id)} />
    </>
  );
}

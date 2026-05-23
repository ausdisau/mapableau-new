"use client";

import { useEffect, useState } from "react";

type Goal = { id: string; title: string; status: string };

export function SupportGoalsPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch("/api/participant/goals")
      .then((r) => r.json())
      .then((d) => setGoals(d.goals ?? []));
  }, []);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/participant/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const data = await res.json();
      setGoals((g) => [data.goal, ...g]);
      setTitle("");
    }
  }

  return (
    <section aria-labelledby="goals-heading">
      <h2 id="goals-heading" className="font-heading text-lg font-semibold">
        Your support goals
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Goals help you and your providers understand what you are working toward.
      </p>
      <ul className="mt-4 space-y-2">
        {goals.map((g) => (
          <li key={g.id} className="rounded border p-3">
            <span className="font-medium">{g.title}</span>
            <span className="ml-2 text-xs text-muted-foreground">({g.status})</span>
          </li>
        ))}
      </ul>
      <form onSubmit={addGoal} className="mt-4 flex gap-2">
        <input
          aria-label="New goal title"
          className="min-h-11 flex-1 rounded border px-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Get out in the community twice a week"
        />
        <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
          Add goal
        </button>
      </form>
    </section>
  );
}

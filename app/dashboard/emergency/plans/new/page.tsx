"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEvacuationPlanPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [steps, setSteps] = useState("Grab emergency bag\nExit via front door\nWait at letterbox");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/emergency/evacuation-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        meetingPoint,
        planType: "home",
        steps: steps
          .split("\n")
          .filter(Boolean)
          .map((instruction) => ({ instruction })),
      }),
    });
    if (res.ok) router.push("/dashboard/emergency/plans");
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link href="/dashboard/emergency/plans" className="text-sm text-primary underline">
        ← Plans
      </Link>
      <h1 className="font-heading text-2xl font-bold">New evacuation plan</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          placeholder="Plan title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full min-h-10 rounded-lg border border-border px-3"
        />
        <input
          placeholder="Meeting point"
          value={meetingPoint}
          onChange={(e) => setMeetingPoint(e.target.value)}
          className="w-full min-h-10 rounded-lg border border-border px-3"
        />
        <div>
          <label htmlFor="steps" className="block text-sm font-medium">
            Steps (one per line)
          </label>
          <textarea
            id="steps"
            required
            rows={6}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          Save plan
        </button>
      </form>
    </div>
  );
}

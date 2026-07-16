"use client";

import { useState } from "react";

export default function ProviderAssignmentsPage() {
  const [organisationId, setOrganisationId] = useState("");
  const [learnerUserId, setLearnerUserId] = useState("");
  const [courseSlug, setCourseSlug] = useState("mapable-worker-foundations");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetch("/api/academy/provider/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organisationId, learnerUserId, courseSlug }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(data?.error ?? "Assignment failed.");
      return;
    }
    setMessage("Course assigned and learner enrolled.");
  }

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Assignments</h1>
      <form onSubmit={onAssign} className="max-w-lg space-y-3">
        <label className="block text-sm">
          Organisation ID
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={organisationId}
            onChange={(e) => setOrganisationId(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Learner user ID
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={learnerUserId}
            onChange={(e) => setLearnerUserId(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Course slug
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={courseSlug}
            onChange={(e) => setCourseSlug(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="rounded bg-teal-800 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Assign course
        </button>
      </form>
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}

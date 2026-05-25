"use client";

import { useState } from "react";

type NeedRow = {
  category: string;
  plainLanguageNeed: string;
  importance: string;
  notes: string;
};

export function AccessNeedsForm({
  initialNeeds,
  summary,
}: {
  initialNeeds: NeedRow[];
  summary: string;
}) {
  const [needs, setNeeds] = useState<NeedRow[]>(
    initialNeeds.length
      ? initialNeeds
      : [{ category: "Mobility", plainLanguageNeed: "", importance: "", notes: "" }]
  );
  const [accessSummary, setAccessSummary] = useState(summary);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setStatus("Saving…");
        const res = await fetch("/api/participant/access-needs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ needs, accessNeedsSummary: accessSummary }),
        });
        if (!res.ok) {
          setStatus("");
          setError("Could not save access needs");
          return;
        }
        setStatus("Access needs saved.");
      }}
    >
      {error ? (
        <div role="alert" className="text-red-800 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="summary" className="block text-sm font-medium mb-1">
          Short summary
        </label>
        <textarea
          id="summary"
          rows={2}
          className="w-full border rounded-md px-3 py-2"
          value={accessSummary}
          onChange={(e) => setAccessSummary(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Specific needs</legend>
        {needs.map((row, i) => (
          <div
            key={i}
            className="mb-4 p-4 border border-slate-200 rounded-lg space-y-2"
          >
            <input
              aria-label={`Category ${i + 1}`}
              placeholder="Category (e.g. Communication)"
              className="w-full min-h-11 border rounded-md px-3"
              value={row.category}
              onChange={(e) => {
                const next = [...needs];
                next[i] = { ...row, category: e.target.value };
                setNeeds(next);
              }}
            />
            <textarea
              aria-label={`Need ${i + 1}`}
              placeholder="What helps you?"
              rows={2}
              className="w-full border rounded-md px-3 py-2"
              value={row.plainLanguageNeed}
              onChange={(e) => {
                const next = [...needs];
                next[i] = { ...row, plainLanguageNeed: e.target.value };
                setNeeds(next);
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-blue-800 font-medium min-h-11"
          onClick={() =>
            setNeeds([
              ...needs,
              {
                category: "",
                plainLanguageNeed: "",
                importance: "",
                notes: "",
              },
            ])
          }
        >
          Add another need
        </button>
      </fieldset>

      <button
        type="submit"
        className="min-h-11 px-4 rounded-md bg-blue-700 text-white font-medium"
      >
        Save access needs
      </button>
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </form>
  );
}

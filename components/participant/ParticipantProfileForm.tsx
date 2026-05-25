"use client";

import { useState } from "react";

type Initial = {
  displayName: string;
  preferredName: string;
  homeSuburb: string;
  homeState: string;
  participantNotes: string;
  accessNeedsSummary: string;
  mainSupportGoals: string;
};

export function ParticipantProfileForm({ initial }: { initial: Initial }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  return (
    <form
      className="space-y-4 max-w-lg"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setStatus("Saving…");
        const res = await fetch("/api/participant/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          setStatus("");
          setError("Could not save profile");
          return;
        }
        setStatus("Profile saved.");
      }}
    >
      {error ? (
        <div role="alert" className="text-red-800 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-1">
          Display name
        </label>
        <input
          id="displayName"
          required
          className="w-full min-h-11 border rounded-md px-3"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="preferredName" className="block text-sm font-medium mb-1">
          Preferred name
        </label>
        <input
          id="preferredName"
          className="w-full min-h-11 border rounded-md px-3"
          value={form.preferredName}
          onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="homeSuburb" className="block text-sm font-medium mb-1">
            Suburb
          </label>
          <input
            id="homeSuburb"
            className="w-full min-h-11 border rounded-md px-3"
            value={form.homeSuburb}
            onChange={(e) => setForm({ ...form, homeSuburb: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="homeState" className="block text-sm font-medium mb-1">
            State
          </label>
          <input
            id="homeState"
            className="w-full min-h-11 border rounded-md px-3"
            value={form.homeState}
            onChange={(e) => setForm({ ...form, homeState: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="goals" className="block text-sm font-medium mb-1">
          Main support goals
        </label>
        <textarea
          id="goals"
          rows={3}
          className="w-full border rounded-md px-3 py-2"
          value={form.mainSupportGoals}
          onChange={(e) => setForm({ ...form, mainSupportGoals: e.target.value })}
        />
      </div>

      <button
        type="submit"
        className="min-h-11 px-4 rounded-md bg-blue-700 text-white font-medium"
      >
        Save profile
      </button>
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </form>
  );
}

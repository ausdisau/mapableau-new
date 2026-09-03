"use client";

import { useEffect, useState } from "react";

type Quest = {
  id: string;
  question: string;
  helpText?: string;
  locationRequired: boolean;
  evidenceOptional: boolean;
};

export function AccessQuestForm() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questId, setQuestId] = useState("");
  const [value, setValue] = useState<"yes" | "no" | "unknown">("unknown");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [note, setNote] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/access/quests")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.quests) {
          setQuests(data.quests);
          if (data.quests[0]) setQuestId(data.quests[0].id);
        }
      })
      .catch(() => setError("Could not load quests. Feature may be disabled."));
  }, []);

  const selected = quests.find((q) => q.id === questId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `key-${Date.now()}`;
    const body: Record<string, unknown> = {
      questId,
      value,
      idempotencyKey,
      actorRef: "web-quest-form",
      note: [note, photoNote ? `Photo note: ${photoNote}` : null]
        .filter(Boolean)
        .join(" "),
      valueQualifier: "EXPERIENCED",
    };
    if (lat) body.lat = Number(lat);
    if (lng) body.lng = Number(lng);

    try {
      const res = await fetch("/api/access/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        return;
      }
      setSuccess("Observation recorded as community evidence (unverified).");
    } catch {
      setError("Network error during submission");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="max-w-lg space-y-4"
      onSubmit={onSubmit}
      aria-labelledby="quest-form-title"
    >
      <h1 id="quest-form-title" className="text-2xl font-semibold">
        Access Quest
      </h1>
      <p className="text-sm text-muted-foreground">
        Map-independent quest form. Answers are observations — not verified
        accessibility guarantees.
      </p>

      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-700" role="status">{success}</p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">Quest</span>
        <select
          name="questId"
          required
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
          value={questId}
          onChange={(e) => setQuestId(e.target.value)}
        >
          {quests.map((q) => (
            <option key={q.id} value={q.id}>{q.question}</option>
          ))}
        </select>
      </label>

      {selected?.helpText ? (
        <p className="text-sm text-muted-foreground">{selected.helpText}</p>
      ) : null}

      <fieldset>
        <legend className="text-sm font-medium">Your answer</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {(["yes", "no", "unknown"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 min-h-11">
              <input
                type="radio"
                name="value"
                value={opt}
                checked={value === opt}
                onChange={() => setValue(opt)}
              />
              <span className="capitalize">{opt === "unknown" ? "Unknown" : opt}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {selected?.locationRequired ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Latitude</span>
            <input
              type="number"
              step="any"
              required
              className="mt-1 min-h-11 w-full rounded-lg border px-3"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Longitude</span>
            <input
              type="number"
              step="any"
              required
              className="mt-1 min-h-11 w-full rounded-lg border px-3"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">Note (optional)</span>
        <textarea
          name="note"
          rows={3}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {selected?.evidenceOptional ? (
        <label className="block">
          <span className="text-sm font-medium">Photo note (optional)</span>
          <input
            type="text"
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
            placeholder="Describe photo you would attach separately"
            value={photoNote}
            onChange={(e) => setPhotoNote(e.target.value)}
          />
        </label>
      ) : null}

      <button
        type="submit"
        disabled={loading || !questId}
        className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit observation"}
      </button>
    </form>
  );
}

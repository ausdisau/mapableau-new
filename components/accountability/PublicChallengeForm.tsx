"use client";

import { useState } from "react";

const SUBJECT_TYPES = [
  { value: "statistic", label: "Incorrect statistic" },
  { value: "accessibility", label: "Outdated accessibility information" },
  { value: "methodology", label: "Misleading methodology" },
  { value: "missing_context", label: "Missing context" },
  { value: "inaccessible_publication", label: "Inaccessible publication" },
  { value: "governance", label: "Incorrect governance information" },
  { value: "ai_system", label: "AI systems statement" },
  { value: "commitment", label: "Public commitment update" },
] as const;

export function PublicChallengeForm() {
  const [subjectType, setSubjectType] = useState<string>("statistic");
  const [subjectPublicId, setSubjectPublicId] = useState("");
  const [description, setDescription] = useState("");
  const [trackingReference, setTrackingReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setTrackingReference(null);
    try {
      const response = await fetch("/api/accountability/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType,
          subjectPublicId: subjectPublicId || undefined,
          description,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        trackingReference?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Unable to submit challenge");
        return;
      }
      setTrackingReference(data.trackingReference ?? null);
      setDescription("");
      setSubjectPublicId("");
    } catch {
      setError("Unable to submit challenge. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <label htmlFor="subjectType" className="block text-sm font-medium">
          What are you challenging?
        </label>
        <select
          id="subjectType"
          name="subjectType"
          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          value={subjectType}
          onChange={(e) => setSubjectType(e.target.value)}
          required
        >
          {SUBJECT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="subjectPublicId" className="block text-sm font-medium">
          Public reference (optional)
        </label>
        <input
          id="subjectPublicId"
          name="subjectPublicId"
          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          value={subjectPublicId}
          onChange={(e) => setSubjectPublicId(e.target.value)}
          placeholder="Metric code, commitment slug, or report id"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Describe the issue
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          rows={5}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-describedby="description-help"
        />
        <p id="description-help" className="mt-1 text-xs text-muted-foreground">
          Do not include personal information about participants, workers or
          complainants.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {trackingReference ? (
        <p role="status" className="rounded-lg bg-secondary/10 px-3 py-2 text-sm">
          Challenge received. Your public tracking reference is{" "}
          <strong>{trackingReference}</strong>. We do not publish submitter
          identity.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
      >
        {pending ? "Submitting…" : "Submit challenge"}
      </button>
    </form>
  );
}

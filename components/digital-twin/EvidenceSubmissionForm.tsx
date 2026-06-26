"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";

type Props = {
  placeId: string;
  placeName: string;
  featureOptions?: { id: string; name: string }[];
};

export function EvidenceSubmissionForm({ placeId, placeName, featureOptions = [] }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/digital-twin/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          featureId: data.get("featureId") || undefined,
          evidenceType: data.get("evidenceType"),
          title: data.get("title"),
          summary: data.get("summary"),
          confidence: data.get("confidence") || "medium",
          measurementNotes: data.get("measurementNotes") || undefined,
          consentToPublish: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setStatus("success");
      setMessage(json.message ?? "Evidence submitted for review.");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Submission failed");
    }
  }

  return (
    <section aria-labelledby="evidence-form-heading" className="rounded-xl border border-border p-5">
      <h2 id="evidence-form-heading" className="text-lg font-semibold">
        Suggest an update for {placeName}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Submissions are reviewed before publication. Do not include private health or disability
        details unless you consent to moderated publication.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {featureOptions.length > 0 && (
          <div>
            <label htmlFor="featureId" className="block text-sm font-medium">
              Feature or zone (optional)
            </label>
            <select
              id="featureId"
              name="featureId"
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">General place information</option>
              {featureOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="evidenceType" className="block text-sm font-medium">
            Evidence type
          </label>
          <select
            id="evidenceType"
            name="evidenceType"
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="user_review">Community observation</option>
            <option value="photo">Photo (link/description)</option>
            <option value="measurement">Measurement</option>
            <option value="maintenance_update">Maintenance update</option>
            <option value="venue_declaration">Venue information</option>
          </select>
        </div>

        <AccessibleFormField id="title" label="Title" required>
          <input id="title" name="title" required className={formInputClass} />
        </AccessibleFormField>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium">
            Summary
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            rows={4}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="measurementNotes" className="block text-sm font-medium">
            Measurements (optional)
          </label>
          <input
            id="measurementNotes"
            name="measurementNotes"
            type="text"
            placeholder="e.g. doorway 920mm, ramp gradient 1:14"
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="confidence" className="block text-sm font-medium">
            Your confidence
          </label>
          <select
            id="confidence"
            name="confidence"
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="low">Low — not fully sure</option>
            <option value="medium">Medium — fairly confident</option>
            <option value="high">High — measured or verified</option>
          </select>
        </div>

        <label className="flex min-h-11 items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required className="mt-1 size-4" />
          <span>
            I consent to this information being reviewed for possible publication on MapAble
            Digital Twin. I understand it will not be published automatically.
          </span>
        </label>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="min-h-11 rounded-xl bg-[#005B7F] px-6 text-sm font-semibold text-white hover:bg-[#004a66] disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting…" : "Submit for review"}
        </button>

        {message && (
          <p
            role={status === "error" ? "alert" : "status"}
            className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {message}
          </p>
        )}
      </form>
    </section>
  );
}

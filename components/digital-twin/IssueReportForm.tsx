"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";

type Props = {
  placeId: string;
  placeName: string;
};

export function IssueReportForm({ placeId, placeName }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(`/api/digital-twin/places/${placeId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          issueType: data.get("issueType"),
          severity: data.get("severity"),
          summary: data.get("summary"),
          details: data.get("details") || undefined,
          dateObserved: data.get("dateObserved") || undefined,
          wantsFollowUp: data.get("wantsFollowUp") === "on",
          contactEmail: data.get("contactEmail") || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setStatus("success");
      setMessage(json.message ?? "Issue reported for review.");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Submission failed");
    }
  }

  return (
    <section aria-labelledby="issue-form-heading" className="rounded-xl border border-border p-5">
      <h2 id="issue-form-heading" className="text-lg font-semibold">
        Report an access issue at {placeName}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        For urgent safety or emergency situations, contact emergency services (000 in Australia)
        or the relevant authority. This form is for moderated community updates only.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="issueType" className="block text-sm font-medium">
            Issue type
          </label>
          <select
            id="issueType"
            name="issueType"
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="access_barrier">Access barrier</option>
            <option value="outdated_info">Outdated information</option>
            <option value="maintenance">Maintenance / temporary closure</option>
            <option value="safety">Safety concern</option>
            <option value="service_quality">Service quality</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="severity" className="block text-sm font-medium">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <AccessibleFormField id="summary" label="Summary" required>
          <input id="summary" name="summary" required className={formInputClass} />
        </AccessibleFormField>

        <div>
          <label htmlFor="details" className="block text-sm font-medium">
            What happened (optional)
          </label>
          <textarea
            id="details"
            name="details"
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="dateObserved" className="block text-sm font-medium">
            Date observed (optional)
          </label>
          <input
            id="dateObserved"
            name="dateObserved"
            type="date"
            className="mt-1 min-h-11 rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="wantsFollowUp" className="size-4" />
          I would like follow-up about this report
        </label>

        <AccessibleFormField
          id="contactEmail"
          label="Contact email (optional, if you want follow-up)"
        >
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className={formInputClass}
          />
        </AccessibleFormField>

        <p className="text-xs text-muted-foreground">
          Contact details are used only for follow-up if requested. They are not displayed publicly
          unless you explicitly choose anonymous public display in a future release.
        </p>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="min-h-11 rounded-xl bg-[#005B7F] px-6 text-sm font-semibold text-white hover:bg-[#004a66] disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting…" : "Submit report for review"}
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

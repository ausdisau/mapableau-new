"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const DECISIONS = [
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "needs_more_information", label: "Needs more information" },
  { value: "not_required", label: "Not required" },
  { value: "expired", label: "Mark expired" },
  { value: "suspended", label: "Suspended" },
  { value: "barred", label: "Barred" },
] as const;

export function WwcDecisionPanel({ verificationId }: { verificationId: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<string>("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [nextCheckAt, setNextCheckAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/admin/verification/wwc/${verificationId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        reviewNotes: reviewNotes || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        nextCheckAt: nextCheckAt ? new Date(nextCheckAt).toISOString() : undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Decision recorded.");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Decision failed");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Admin decision</h2>
      <label htmlFor="wwc-decision" className="block text-sm font-medium">
        Decision
      </label>
      <select
        id="wwc-decision"
        className={formInputClass}
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
      >
        {DECISIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
      <label htmlFor="wwc-review-notes" className="block text-sm font-medium">
        Review notes
      </label>
      <textarea
        id="wwc-review-notes"
        className={formInputClass}
        rows={3}
        value={reviewNotes}
        onChange={(e) => setReviewNotes(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="wwc-admin-expires" className="block text-sm font-medium">
            Expiry date
          </label>
          <input
            id="wwc-admin-expires"
            type="date"
            className={formInputClass}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="wwc-next-check" className="block text-sm font-medium">
            Next review date
          </label>
          <input
            id="wwc-next-check"
            type="date"
            className={formInputClass}
            value={nextCheckAt}
            onChange={(e) => setNextCheckAt(e.target.value)}
          />
        </div>
      </div>
      <Button type="button" variant="default" size="default" loading={loading} onClick={submit}>
        Save decision
      </Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </section>
  );
}

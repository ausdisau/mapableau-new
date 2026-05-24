"use client";

import { useState } from "react";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function ReferralBuilder({
  participantId,
  onCreated,
}: {
  participantId: string;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/support-coordinator/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, title, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create referral");
        return;
      }
      setSuccess(
        "Referral created. The participant must approve before it becomes a booking or provider enquiry."
      );
      setTitle("");
      setDescription("");
      onCreated?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MapAbleCard
      title="Referral builder"
      description="Participant approval is required before a referral becomes a booking."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
            {error}
          </div>
        ) : null}
        {success ? (
          <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
            {success}
          </div>
        ) : null}
        <div>
          <label htmlFor="referral-title" className="block text-sm font-medium">
            Referral title
          </label>
          <input
            id="referral-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full min-h-11 rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="referral-description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="referral-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create referral"}
        </button>
      </form>
    </MapAbleCard>
  );
}

"use client";

import React, { useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { ApprovalCard } from "@/components/access-intelligence/approval-card";
import { Button } from "@/components/ui/button";
import { DEMO_PLACES } from "@/lib/access-intelligence/demo-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const CATEGORIES = [
  "lift_outage",
  "toilet_unavailable",
  "blocked_route",
  "locked_entrance",
  "automatic_door_fault",
  "construction",
  "flooding",
  "crowding",
  "high_noise",
  "other",
] as const;

export function AccessPulseClient() {
  const [placeId, setPlaceId] = useState(DEMO_PLACES[0]?.id ?? "");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("lift_outage");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (approved: boolean) => {
    setError(null);
    setStatus(null);
    const res = await fetch("/api/access-intelligence/barrier-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved,
        placeId,
        description: `${category.replaceAll("_", " ")}: ${description}`,
        category,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!approved) {
      setStatus("Report cancelled — nothing was published.");
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not publish report");
      return;
    }
    setStatus(`Published barrier report ${data.report.id} (demo moderation queue).`);
    setDescription("");
  };

  return (
    <AccessIntelligenceShell
      title="Access Pulse"
      description="Report temporary barriers. Reports expire unless reconfirmed, and publishing requires explicit approval."
    >
      <form
        className="max-w-2xl space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPending(true);
        }}
      >
        <label className="block text-sm font-semibold">
          Place
          <select
            className={`mt-1 w-full min-h-11 rounded-xl border px-3 ${mapableCareFocusRing}`}
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
          >
            {DEMO_PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Category
          <select
            className={`mt-1 w-full min-h-11 rounded-xl border px-3 ${mapableCareFocusRing}`}
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof CATEGORIES)[number])
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Description
          <textarea
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${mapableCareFocusRing}`}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <Button
          type="submit"
          variant="default"
          size="default"
          disabled={!description.trim()}
        >
          Review before publishing
        </Button>
      </form>

      {pending ? (
        <div className="mt-6 max-w-2xl">
          <ApprovalCard
            title="Publish barrier report?"
            recipient="Community moderation (demo)"
            purpose="Temporary Access Pulse report"
            fieldsOrQuestions={[
              `Place: ${DEMO_PLACES.find((p) => p.id === placeId)?.name ?? placeId}`,
              `Category: ${category}`,
              description,
            ]}
            onApprove={() => void submit(true)}
            onCancel={() => void submit(false)}
          />
        </div>
      ) : null}

      {status ? (
        <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm" role="status">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </AccessIntelligenceShell>
  );
}

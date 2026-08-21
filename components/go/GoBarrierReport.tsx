"use client";

import { useState } from "react";

import type { RouteOption } from "@/lib/go/contracts/route-contracts";

const BARRIER_TYPES = [
  "blocked_path",
  "lift_outage",
  "construction",
  "poor_surface",
  "missing_curb_ramp",
  "narrow_path",
  "unsafe_crossing",
  "other",
] as const;

export function GoBarrierReport({
  segmentIds,
  onReported,
}: {
  segmentIds: string[];
  onReported?: () => void;
}) {
  const [segmentId, setSegmentId] = useState(segmentIds[0] ?? "");
  const [type, setType] = useState<(typeof BARRIER_TYPES)[number]>("blocked_path");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/go/barriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId, type, description: description || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus(data.error ?? "Report failed");
        return;
      }
      setStatus("Barrier reported. Status: community reported until verification.");
      onReported?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border p-4" aria-labelledby="go-barrier-heading">
      <h2 id="go-barrier-heading" className="font-semibold">
        Report a barrier
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Reports are community reported until verified. Photo upload is optional and not required.
      </p>
      <div className="mt-3 space-y-3">
        <label className="block text-sm">
          Segment
          <select
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
            value={segmentId}
            onChange={(e) => setSegmentId(e.target.value)}
          >
            {segmentIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Type
          <select
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            {BARRIER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Description (optional)
          <textarea
            className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !segmentId}
          className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit report"}
        </button>
        {status && (
          <p role="status" className="text-sm">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}

export function GoInputModeIndicator({ mode }: { mode: "guided" | "list" | "map" }) {
  return (
    <p className="text-sm text-muted-foreground">
      Interface mode: <strong>{mode}</strong>. Keyboard and switch access supported via focusable
      controls.
    </p>
  );
}

export function GoAssistancePanel() {
  return (
    <aside className="rounded-xl border border-dashed p-4 text-sm">
      <h2 className="font-semibold">Need assistance?</h2>
      <p className="mt-1 text-muted-foreground">
        MapAble Go provides route options — you remain the decision-maker. For immediate danger, call
        000. Human support escalation is planned via MapAble Safeguarding surfaces.
      </p>
    </aside>
  );
}

export function GoAccessibilitySummary({ route }: { route: RouteOption }) {
  return (
    <section aria-labelledby="go-a11y-summary-heading" className="text-sm">
      <h2 id="go-a11y-summary-heading" className="font-semibold">
        Accessibility summary
      </h2>
      <ul className="mt-2 space-y-1">
        <li>Stairs on route: {route.accessibility.stairs}</li>
        <li>Maximum slope: {route.accessibility.maximumSlopePercent.toFixed(1)}%</li>
        <li>Minimum width: {route.accessibility.minimumWidthMm} mm</li>
        {route.surfaceSummary.map((s) => (
          <li key={s.type}>
            {s.type}: {s.percent}%
          </li>
        ))}
      </ul>
    </section>
  );
}

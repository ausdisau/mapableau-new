"use client";

import { useMemo, useState } from "react";

import { evaluateFeature } from "@/lib/access/signals/evaluate";
import { makeSyntheticNetwork } from "@/lib/access/signals/network-fixture";
import { getRaguDescriptor } from "@/lib/access/signals/ragu";
import { DRAFT_RULESET } from "@/lib/access/signals/ruleset";
import type { RagStatus } from "@/lib/access/signals/types";

import { RaguIcon } from "./SignalsRaguIcon";

type SyntheticDraft = {
  featureId: string;
  proposedStatus: RagStatus;
  overrideStatus: RagStatus | null;
  overrideReason: string;
  reviewState: "draft" | "submitted" | "approved" | "rejected" | "returned";
  audit: string[];
};

export function AssessorAccessSignalsClient() {
  const network = useMemo(() => makeSyntheticNetwork(), []);
  const [featureId, setFeatureId] = useState(network.features[0]!.featureId);
  const feature = network.features.find((item) => item.featureId === featureId)!;
  const proposed = evaluateFeature(feature);

  const [draft, setDraft] = useState<SyntheticDraft>({
    featureId: feature.featureId,
    proposedStatus: proposed.status,
    overrideStatus: null,
    overrideReason: "",
    reviewState: "draft",
    audit: [],
  });

  function selectFeature(nextId: string) {
    const next = network.features.find((item) => item.featureId === nextId)!;
    const nextProposed = evaluateFeature(next);
    setFeatureId(nextId);
    setDraft({
      featureId: nextId,
      proposedStatus: nextProposed.status,
      overrideStatus: null,
      overrideReason: "",
      reviewState: "draft",
      audit: [`Selected ${nextId} at ${new Date().toISOString()}`],
    });
  }

  function submitReview() {
    if (draft.overrideStatus && !draft.overrideReason.trim()) {
      setDraft((prev) => ({
        ...prev,
        audit: [...prev.audit, "Override blocked — reason required"],
      }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      reviewState: "submitted",
      audit: [
        ...prev.audit,
        `Submitted for human review (${prev.overrideStatus ?? prev.proposedStatus})`,
      ],
    }));
  }

  const displayStatus = draft.overrideStatus ?? draft.proposedStatus;

  return (
    <div className="space-y-4" data-testid="assessor-signals-form">
      <label className="block text-sm font-semibold">
        Fixture feature
        <select
          className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-3"
          value={featureId}
          onChange={(event) => selectFeature(event.target.value)}
        >
          {network.features.map((item) => (
            <option key={item.featureId} value={item.featureId}>
              {item.label} ({item.domain})
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-xl border border-slate-200 p-4 text-sm">
        <p className="font-bold">Draft rules consulted</p>
        <ul className="mt-2 list-disc pl-5">
          {DRAFT_RULESET.filter((rule) => rule.domain === feature.domain || rule.domain === "wayfinding")
            .slice(0, 3)
            .map((rule) => (
              <li key={rule.id}>
                {rule.id}: {rule.title} — {rule.draftReference}
              </li>
            ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold">
        <RaguIcon status={proposed.status} />
        Engine proposal: {getRaguDescriptor(proposed.status).label} —{" "}
        {proposed.explanation}
      </div>

      <label className="block text-sm font-semibold">
        Assessor override (optional)
        <select
          className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-3"
          value={draft.overrideStatus ?? ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              overrideStatus: (event.target.value || null) as RagStatus | null,
            }))
          }
        >
          <option value="">No override</option>
          <option value="red">Red</option>
          <option value="amber">Amber</option>
          <option value="green">Green</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>

      <label className="block text-sm font-semibold">
        Override reason (required when overriding)
        <textarea
          className="mt-1 block min-h-24 w-full rounded-xl border border-slate-200 p-3"
          value={draft.overrideReason}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, overrideReason: event.target.value }))
          }
        />
      </label>

      <p className="text-sm" role="status">
        Working status: {getRaguDescriptor(displayStatus).label} · review:{" "}
        {draft.reviewState}
      </p>

      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        onClick={submitReview}
      >
        Submit for human review
      </button>

      <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-600">
        <p className="font-bold">Synthetic audit ledger</p>
        <ul className="mt-1 list-disc pl-5">
          {draft.audit.length === 0 ? (
            <li>No events yet</li>
          ) : (
            draft.audit.map((line) => <li key={line}>{line}</li>)
          )}
        </ul>
      </div>
    </div>
  );
}

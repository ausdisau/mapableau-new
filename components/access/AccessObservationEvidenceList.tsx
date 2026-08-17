"use client";

import { useId, useState } from "react";

import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Observation = {
  id: string;
  featureKey: string;
  disputed: boolean;
  provenance: {
    displayLabel: string;
    unverified: boolean;
    aiInferred: boolean;
  };
  evidenceAssets: Array<{ id: string; assetId: string; evidenceKind: string }>;
};

export function AccessObservationEvidenceList({
  observations,
}: {
  observations: Observation[];
}) {
  if (observations.length === 0) {
    return (
      <p className="text-sm text-slate-600" role="status">
        No access observations with provenance have been published for this place
        yet. Unknown does not mean inaccessible.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Access observations">
      {observations.map((observation) => (
        <li
          key={observation.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <p className="text-sm font-semibold text-[#0C1833]">
            {observation.featureKey}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {observation.provenance.displayLabel}
            {observation.provenance.unverified ? " — unverified" : ""}
            {observation.disputed ? " (disputed)" : ""}
          </p>
          {observation.provenance.aiInferred ? (
            <p className="mt-1 text-sm font-semibold text-slate-700">
              AI inferred evidence is never treated as independently verified.
            </p>
          ) : null}
          {observation.evidenceAssets.length > 0 ? (
            <ul className="mt-2 space-y-1" aria-label="Attached evidence">
              {observation.evidenceAssets.map((item) => (
                <li key={item.id}>
                  <EvidenceReadLink assetId={item.assetId} kind={item.evidenceKind} />
                </li>
              ))}
            </ul>
          ) : null}
          <DisputeObservationButton observationId={observation.id} />
        </li>
      ))}
    </ul>
  );
}

function EvidenceReadLink({
  assetId,
  kind,
}: {
  assetId: string;
  kind: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function openEvidence() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/storage/assets/${assetId}/read-url`, {
        method: "POST",
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Could not open evidence");
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open evidence");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openEvidence}
        disabled={busy}
        className={`min-h-11 text-sm font-semibold text-[#005B7F] underline underline-offset-4 disabled:opacity-60 ${mapableInteractiveFocusRing}`}
      >
        {busy ? "Opening…" : `View ${kind} evidence (temporary link)`}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DisputeObservationButton({ observationId }: { observationId: string }) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const notes = String(new FormData(event.currentTarget).get("notes") ?? "");
    const res = await fetch(
      `/api/access-infrastructure/observations/${observationId}/dispute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      },
    );
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Could not record dispute");
      return;
    }
    setDone(true);
    setOpen(false);
  }

  if (done) {
    return (
      <p className="mt-2 text-sm text-slate-600" role="status">
        Dispute recorded. The observation is labelled disputed and is not
        independently verified.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        className={`min-h-11 rounded-lg border px-3 text-sm ${mapableInteractiveFocusRing}`}
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        Dispute this observation
      </button>
      {open ? (
        <form id={dialogId} className="mt-2 space-y-2" onSubmit={submit}>
          <label className="block text-sm">
            What is incorrect?
            <textarea
              name="notes"
              rows={2}
              className={`mt-1 w-full rounded-lg border px-2 py-1 ${mapableInteractiveFocusRing}`}
            />
          </label>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className={`min-h-11 rounded-lg bg-[#005B7F] px-4 text-sm font-semibold text-white ${mapableInteractiveFocusRing}`}
          >
            Submit dispute
          </button>
        </form>
      ) : null}
    </div>
  );
}

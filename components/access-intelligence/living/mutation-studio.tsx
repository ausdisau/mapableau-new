"use client";

import React, { useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Mutation = {
  id: string;
  title: string;
  description: string;
  estimatedEffort: string;
  evidenceRequiredAfterCompletion: string[];
};

export function MutationStudio({ placeId }: { placeId: string }) {
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [coverage, setCoverage] = useState<{
    suitable: number;
    unknown: number;
    blocked: number;
    suitableWithConditions: number;
    testedProfileCount: number;
  } | null>(null);
  const [preview, setPreview] = useState<{
    beforeCoverage: typeof coverage;
    afterCoverage: typeof coverage;
    evidenceRequiredAfterCompletion: string[];
    note: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/access-intelligence/mutations/preview", {
      headers: { "x-access-role": "demo_preview" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
          return;
        }
        setMutations(data.mutations ?? []);
        setCoverage(data.coverage);
      });
  }, [placeId]);

  async function previewMutation(mutationId: string) {
    const res = await fetch("/api/access-intelligence/mutations/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-role": "demo_preview",
      },
      body: JSON.stringify({ action: "preview", mutationId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setPreview({
      beforeCoverage: data.beforeCoverage,
      afterCoverage: data.afterCoverage,
      evidenceRequiredAfterCompletion: data.evidenceRequiredAfterCompletion,
      note: data.note,
    });
  }

  async function saveDraft(mutationId: string) {
    const res = await fetch("/api/access-intelligence/mutations/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-role": "demo_preview",
      },
      body: JSON.stringify({ action: "save_draft", mutationId }),
    });
    const data = await res.json();
    setMessage(data.note ?? data.error);
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        Previewing a mutation does not modify baseline data. There is no “Apply to real
        building” action in this demo.
      </p>
      {coverage ? (
        <section aria-labelledby="coverage-heading" className="rounded-2xl border border-slate-200 p-5">
          <h2 id="coverage-heading" className="text-xl font-black">
            Current Access Coverage
          </h2>
          <p className="mt-2 text-slate-700">
            {coverage.testedProfileCount} synthetic profiles · Suitable {coverage.suitable} ·
            Conditions {coverage.suitableWithConditions} · Unknown {coverage.unknown} · Blocked{" "}
            {coverage.blocked}
          </p>
        </section>
      ) : null}

      <ul className="space-y-4">
        {mutations.map((m) => (
          <li key={m.id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-black">{m.title}</h3>
            <p className="text-slate-700">{m.description}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              Effort {m.estimatedEffort}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`min-h-10 rounded-lg bg-[#005B7F] px-3 text-sm font-bold text-white ${mapableCareFocusRing}`}
                onClick={() => void previewMutation(m.id)}
              >
                Preview
              </button>
              <button
                type="button"
                className={`min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
                onClick={() => void saveDraft(m.id)}
              >
                Save draft
              </button>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <section aria-labelledby="preview-heading" className="rounded-2xl bg-[#E8F4F8] p-5">
          <h2 id="preview-heading" className="text-xl font-black">
            Coverage comparison
          </h2>
          <p className="mt-2">
            Before — unknown {preview.beforeCoverage?.unknown}, blocked{" "}
            {preview.beforeCoverage?.blocked}. After — unknown {preview.afterCoverage?.unknown},
            blocked {preview.afterCoverage?.blocked}, suitable{" "}
            {preview.afterCoverage?.suitable}.
          </p>
          <h3 className="mt-4 font-black">Evidence required after completion</h3>
          <ul className="mt-1 list-disc pl-5">
            {preview.evidenceRequiredAfterCompletion.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-600">{preview.note}</p>
        </section>
      ) : null}

      {message ? (
        <p role="status" className="text-slate-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
